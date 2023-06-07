<?php
require_once 'global_params.php';
require_once 'connection.php';


function getCalendarApiMethod($actionRequest, $userId, $auth) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	switch ($actionName) {
		case 'getPlannedVacations':
			$actionResponse = getPlannedVacations($actionRequest, $userId);
			break;	
		case 'getWorkCalendar':
			$actionResponse =  getWorkCalendar($actionRequest);
			break;
		case 'getAllCalendarFilters':
			$actionResponse = getAllCalendarFilters($userId);
			break;			
		case 'getVacations':
			$actionResponse = getVacations($actionRequest, $userId);
			break;
		case 'changeVacationApprove':
			$actionResponse = changeVacationApprove($actionRequest, $userId);
			break;
		case 'addVacation':
			$actionResponse = addVacation($actionRequest, $userId);
			break;
		case 'editVacation':
			$actionResponse = editVacation($actionRequest, $userId);
			break;				
		case 'deleteVacation':
			$actionResponse = deleteVacation($actionRequest, $userId);
			break;	
		default:
			$actionResponse['msgStatus'] = 'danger';
			$actionResponse['msgText'] = 'Неизвестный метод.';
			break;	
	}
	return $actionResponse;	
}

function getSelectTextForAllAvailableUserId($userId, $assistantChief) {
	/*userId*/  
	$sqlText = 'select ? as id union all ';
	/*все сотрудники из основной группы userId*/    
	$sqlText .= 'select id from user where subdivision_id=(select subdivision_id from user where id=?) '; 
	$sqlText .= 'union all ';
	/*руководитель основной группы userId*/    
	$sqlText .= 'select chief_id as id from subdivision where id=';
	$sqlText .= '(select subdivision_id from user where id=?) and chief_id is not null union all ';
	/*все сотрудники из основных групп, где userId - руководитель*/    
	$sqlText .= 'select id from user where subdivision_id in ';
	$sqlText .= '(select id from subdivision where chief_id=?) union all ';
	/*все сотрудники из групп userId*/    
	$sqlText .= 'select user_id as id from user_in_group where group_id in ';
	$sqlText .= '(select group_id from user_in_group where user_id=?) union all ';
	/*руководители групп userId*/    
	$sqlText .= 'select chief_id as id from work_group where id in ';
	$sqlText .= '(select group_id from user_in_group where user_id=?) ';
	$sqlText .= 'and chief_id is not null union all ';
	/*все сотрудники из групп, где userId - руководитель*/ 
	$sqlText .= 'select user_id as id from user_in_group where group_id in ';
	$sqlText .= '(select id from work_group where chief_id=?) ';    
	$res = array(); 
	$res['paramType'] = 'ddddddd';
	$res['paramArr'] = array($userId, $userId, $userId, $userId, $userId, $userId, $userId);
	if ($assistantChief != null) {
		/*все сотрудники из основных групп, где assistantChief - руководитель*/    
		$sqlText .= ' union all select id from user where subdivision_id in ';
		$sqlText .= '(select id from subdivision where chief_id=?) ';	
		$res['paramType'] .= 'd';
		$res['paramArr'][] = $assistantChief;
	}
	$res['sqlText'] = $sqlText;
	return $res;	
}


function getPlannedVacations($actionRequest, $userId) {
	$actionResponse['inputRequest'] = $actionRequest;
	$year = isset($actionRequest['year']) ? $actionRequest['year'] : date('Y');
	$actionResponse['year'] = $year;
	$newUserId = $userId;
	
	$rights = get_sql('select s.chief_id from subdivision as s, user as u, user_in_right as e 
						where s.id=u.subdivision_id and e.user_id=u.id and e.right_id=10 and e.user_id=?', 0, 'd', array($userId));
	$row = mysqli_fetch_array($rights);
	if (isset($row['chief_id'])) {
		$newUserId = $row['chief_id'];
	}	
	mysqli_free_result($rights);
	
	$actionResponse['chief_id'] = $newUserId;	
	$actionResponse['vacations'] = array();
	$sqlText = 'select o.name, concat(u.last_name, " ", u.first_name, " ", u.middle_name) as name, 
					date_format(v.date_begin, "%d.%m.%Y") as date_begin,
					date_format(date_add(v.date_begin, interval v.days_count+v.holidays_count-1 day), "%d.%m.%Y") as date_end, 
					v.days_count, v.holidays_count
					from subdivision as s, vacation as v, user as u, employee as e 
					left outer join organization as o on o.id=e.organization_id			  
					where u.id=e.user_id and e.id=v.employee_id and s.id=u.subdivision_id
                    and v.type_id=1 and year(v.date_begin)=? and s.chief_id=?
                    order by o.id, u.last_name, u.first_name, u.middle_name, v.date_begin';					  
	$vacations = get_sql($sqlText, 1, 'sd', array($year, $newUserId));
	while ($vacation = mysqli_fetch_array($vacations)) {
		$vacationObj = array();
		$vacationObj['organization'] = $vacation[0];
		$vacationObj['name'] = $vacation[1];
		$vacationObj['date_begin'] = $vacation[2];
		$vacationObj['date_end'] = $vacation[3];
		$vacationObj['days_count'] = $vacation[4];
		$vacationObj['holidays_count'] = $vacation[5];
		$actionResponse['vacations'][] = $vacationObj;
	}
	mysqli_free_result($vacations);
	return $actionResponse;	
}

function getWorkCalendar($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$year = isset($actionRequest['year']) ? $actionRequest['year'] : date('Y');
	$actionResponse['year'] = $year;
	$dates_fix = get_sql('select date_format(date_fix, "%Y-%m-%d"), day_type_id, date_text 
							from work_calendar where year(date_fix)=? order by date_fix', 0, 's', array($year));
	while ($date_fix = mysqli_fetch_array($dates_fix)) {
		$actionResponse['dates'][$date_fix[0]] = array();
		$actionResponse['dates'][$date_fix[0]]['type'] = $date_fix[1];
		$actionResponse['dates'][$date_fix[0]]['text'] = $date_fix[2];
	}
	mysqli_free_result($dates_fix);
	return $actionResponse;	
}

function getAllCalendarFilters($userId) {
	$assistantChief = null;	
	$assistant_chief_sql = get_sql('select g.chief_id from user as u, user_in_right r, subdivision g	
									where u.id=? and g.id=u.subdivision_id and r.user_id=u.id and r.right_id=10', 0, 'd', array($userId));
	$row = mysqli_fetch_array($assistant_chief_sql);
	$assistantChief = $row['chief_id'];
	mysqli_free_result($assistant_chief_sql);
	$allAvailableUserId = getSelectTextForAllAvailableUserId($userId, $assistantChief);
	$filtersArray = array();
	$codesArray = array();
	
	$codesArray[] = 'year';
	$filtersArray['year'] = array(); 
	$filtersArray['year']['type'] = 'combobox';
	$filtersArray['year']['name'] = 'Год';
	$filtersArray['year']['required'] = true;
	$filtersArray['year']['dataset'] = array();
	$years = get_sql('select distinct year(date_fix), concat(year(date_fix), " г.") 
						from work_calendar order by 1 desc', 1, '', array());
	while ($year = mysqli_fetch_array($years)) {
		$val =  array();
		$val['key'] = $year[0];
		$val['name'] = $year[1];
		$filtersArray['year']['dataset'][] = $val;
	}
	mysqli_free_result($years);
	
	$codesArray[] = 'subdivision';
	$filtersArray['subdivision'] = array(); 
	$filtersArray['subdivision']['type'] = 'combobox';
	$filtersArray['subdivision']['name'] = 'Категория';
	$filtersArray['subdivision']['required'] = false;
	$filtersArray['subdivision']['dataset'] = array();
	$paramType = $allAvailableUserId['paramType'].'d';
	$paramArr = $allAvailableUserId['paramArr'];
	$paramArr[] = $userId;
	$subdivisions = get_sql('select id, name from subdivision where (id in (select subdivision_id from user 
						where id in ('.$allAvailableUserId['sqlText'].'))) or (chief_id=?) 
						order by id', 2, $paramType, $paramArr);
	while ($subdivision = mysqli_fetch_array($subdivisions)) {
		$val =  array();
		$val['key'] = $subdivision[0];
		$val['name'] = $subdivision[1];
		$filtersArray['subdivision']['dataset'][] = $val;
	}
	mysqli_free_result($subdivisions);
	
	$codesArray[] = 'chief';
	$filtersArray['chief'] = array(); 
	$filtersArray['chief']['type'] = 'combobox';
	$filtersArray['chief']['name'] = 'Руководитель';
	$filtersArray['chief']['required'] = false;
	$filtersArray['chief']['dataset'] = array();
	$chiefs = get_sql('select distinct u.id, concat(u.last_name, " ", substring(u.first_name, 1, 1), ".", substring(u.middle_name, 1, 1), ".") 
					    from subdivision as g, user as u where u.id=g.chief_id 
						and u.id in ('.$allAvailableUserId['sqlText'].') order by 2', 
						3, $allAvailableUserId['paramType'],$allAvailableUserId['paramArr']);
	while ($chief = mysqli_fetch_array($chiefs)) {
		$val =  array();
		$val['key'] = $chief[0];
		$val['name'] = $chief[1];
		$filtersArray['chief']['dataset'][] = $val;
	}
	mysqli_free_result($chiefs);
	
	$codesArray[] = 'employees';
	$filtersArray['employees'] = array(); 
	$filtersArray['employees']['type'] = 'multi-select';
	$filtersArray['employees']['name'] = 'Сотрудники';
	$filtersArray['employees']['required'] = false;
	$filtersArray['employees']['dataset'] = array();
	$paramType = $allAvailableUserId['paramType'].'d';
	$paramArr = $allAvailableUserId['paramArr'];
	$paramArr[] = $userId;
	$selectText = 'select u.id, concat(u.last_name, " ", substring(u.first_name, 1, 1), ".", substring(u.middle_name, 1, 1), ".") from user as u ';
	$selectText .= 'where ((u.id in('.$allAvailableUserId['sqlText'].')) or (u.id=?)) ';
	$selectText .= 'and u.id in (select user_id from user_in_right where right_id=1) ';
	$selectText .= 'order by 2';	
	$employees = get_sql($selectText, 4, $paramType, $paramArr);
	while ($employee = mysqli_fetch_array($employees)) {
		$val =  array();
		$val['key'] = $employee[0];
		$val['name'] = $employee[1];
		$filtersArray['employees']['dataset'][] = $val;
	}
	mysqli_free_result($employees);

	$codesArray[] = 'only_active';
	$filtersArray['only_active'] = array(); 
	$filtersArray['only_active']['type'] = 'checkbox';
	$filtersArray['only_active']['name'] = 'Только актуальные сотрудники';
	$filtersArray['only_active']['required'] = false;
	
	$actionResponse = array();
	$actionResponse['codes'] = $codesArray;
	$actionResponse['filters'] = $filtersArray; 	
	return $actionResponse;	
}

function getVacations($actionRequest, $userId) {	
	$actionResponse['inputRequest'] = $actionRequest;
	$filter = isset($actionRequest['filter']) ? $actionRequest['filter'] : null;
	$user_settings_data_sql = get_sql('select u.settings_data, g.chief_id from user as u
										left outer join subdivision as g on g.id=u.subdivision_id
										where u.id=?', 0, 'd', array($userId));
	$row = mysqli_fetch_array($user_settings_data_sql);
	$user_settings_data = json_decode($row['settings_data'], true);
	$actionResponse['user_chief_id'] = $row['chief_id'];
	mysqli_free_result($user_settings_data_sql);		
	if ($filter == null) {
		$filter = $user_settings_data['calendar_filter'];	
	}
	if (!isset($filter['year']['value'])) {
		$filter['year'] = null;
		$filter['year']['name'] = 'Год';
		$filter['year']['value'] = date('Y');
		$filter['year']['text'] = date('Y').' г.';
	}
	$actionResponse['filter'] = $filter;
	$user_settings_data['calendar_filter'] = $filter;
	exec_sql('update user set settings_data=? where id=?', 1, 'sd', array(json_encode($user_settings_data), $userId));
	
	$yearBeginDate = $filter['year']['value'].'-01-01';
	$actionResponse['user_id'] = $userId;
	
	$assistantChief = null;
	$actionResponse['user_rights'] = array();
	$user_rights = get_sql('select r.code, r.id from user_in_right as u, user_right r 
								where u.right_id=r.id and u.user_id=?
								order by r.id', 2, 'd', array($userId));
	while ($user_right=mysqli_fetch_array($user_rights)) {
		$actionResponse['user_rights'][] = $user_right['code'];
		if ($user_right['id'] == 10) {
			$assistantChief = $actionResponse['user_chief_id'];
		}
	}
	mysqli_free_result($user_rights);
	
	$user_chief_rights = get_sql('select count(*) cc from subdivision where chief_id=?', 22, 'd', array($userId));
	$row = mysqli_fetch_array($user_chief_rights);
	if ($row['cc'] > 0) {
		$actionResponse['user_rights'][] = 'chief';
	}
	mysqli_free_result($user_chief_rights);
	
	$allAvailableUserId = getSelectTextForAllAvailableUserId($userId, $assistantChief);	
		
	$actionResponse['vacation_types'] = array();
	$vacation_types = get_sql('select id, name, without_approval, print_form from vacation_type order by order_num', 3, '', array());
	while ($vacation_type=mysqli_fetch_array($vacation_types)) {
		$actionResponse['vacation_types'][$vacation_type['id']] = null;
		$actionResponse['vacation_types'][$vacation_type['id']]['id'] = $vacation_type['id'];
		$actionResponse['vacation_types'][$vacation_type['id']]['name'] = $vacation_type['name'];
		$actionResponse['vacation_types'][$vacation_type['id']]['without_approval'] = $vacation_type['without_approval'];
		$actionResponse['vacation_types'][$vacation_type['id']]['print_form'] = $vacation_type['print_form'];
	}
	mysqli_free_result($vacation_types);

	$actionResponse['employees'] = array();
	$sqlText = 'select e.id, e.user_id, e.prefix_name, concat(u.last_name, " ", u.first_name, " ", u.middle_name,
					  case coalesce(e.prefix_name, "") when "" then "" else concat(" ", e.prefix_name) end) as name, 
					  g.chief_id, e.date_create, e.date_close,
					  concat(u.last_name, " ", substring(u.first_name, 1, 1), ".", substring(u.middle_name, 1, 1), ".",
					  case coalesce(e.prefix_name, "") when "" then "" else concat("<sup>", e.prefix_name, "</sup>") end) as short_name,
					  e.unused_vacation_days
					  from employee as e, user as u
					  left outer join subdivision as g on g.id=u.subdivision_id				  
					  where u.id=e.user_id and e.date_create<date_add(?, interval 1 year) and ifnull(e.date_close, ?)>=? 
					  and ((u.id=?) or (u.id in ('.$allAvailableUserId['sqlText'].')';
	$paramsTypes = 'sssd'.$allAvailableUserId['paramType'];
	$paramsValues = array_merge(array($yearBeginDate, $yearBeginDate, $yearBeginDate, $userId), $allAvailableUserId['paramArr']);
	if (isset($filter['subdivision'])) {
		$sqlText .=	' and (u.subdivision_id=?)';
		$paramsTypes .= 's';
		$paramsValues[] = $filter['subdivision']['value'];
	}	
	if (isset($filter['chief'])) {
		$sqlText .=	' and ((u.subdivision_id in (select id from subdivision where chief_id=?)) or (u.id=?))';
		$paramsTypes .= 'ss';
		$paramsValues[] = $filter['chief']['value'];
		$paramsValues[] = $filter['chief']['value'];
	}
	if (isset($filter['employees'])) {
		if (count($filter['employees']['value']) > 0) {
			$inText = '';
			foreach ($filter['employees']['value'] as $val) {
				$paramsTypes .= 'd';
				$paramsValues[] = $val;
				if ($inText != '') {
					$inText .=	',';	
				}
				$inText .=	'?';
			}
			$sqlText .=	' and (u.id in ('.$inText.'))';
		}
	}
	if (isset($filter['only_active'])) {
		$sqlText .=	' and (e.date_close is null)';
	}		

	$sqlText .= ' and u.id in (select user_id from user_in_right where right_id=1)))';	
	$sqlText .= ' order by ?=u.id desc, 4, e.id';
	$paramsTypes .= 'd';
	$paramsValues[] = $userId;


	//$actionResponse['xxx'] = array();
	//$actionResponse['xxx']['sqlText'] = $sqlText;
	//$actionResponse['xxx']['paramsTypes'] = $paramsTypes;
	//$actionResponse['xxx']['paramsValues'] = $paramsValues;
	
	$employees = get_sql($sqlText, 4, $paramsTypes, $paramsValues);
	while ($employee=mysqli_fetch_array($employees)) {
		$employeeObj = null;
		$employeeObj['id'] = $employee['id'];
		$employeeObj['user_id'] = $employee['user_id'];
		$employeeObj['prefix_name'] = $employee['prefix_name'];
		$employeeObj['name'] = $employee['name'];
		$employeeObj['short_name'] = $employee['short_name'];
		$employeeObj['chief_id'] = $employee['chief_id'];
		$employeeObj['date_create'] = $employee['date_create'];
		$employeeObj['date_close'] = $employee['date_close'];
		$employeeObj['unused_vacation_days'] = $employee['unused_vacation_days'];
		$employeeObj['vacations'] = array();
		$vacations = get_sql('select v.id, v.date_begin, v.days_count, v.holidays_count, v.is_approved, v.type_id  
							from vacation as v
							where year(v.date_begin)=? and v.employee_id=? 
							order by v.date_begin', 5, 'sd', array($filter['year']['value'], $employee['id']));				
		while ($vacation=mysqli_fetch_array($vacations)) {
			$vacationObj = null;
			$vacationObj['id'] = $vacation['id'];
			$vacationObj['date_begin'] = $vacation['date_begin'];
			$vacationObj['days'] = $vacation['days_count'];
			$vacationObj['holidays'] = $vacation['holidays_count'];
			$vacationObj['is_approved'] = $vacation['is_approved'];
			$vacationObj['type_id'] = $vacation['type_id'];
			$employeeObj['vacations'][] = $vacationObj;		
		}
		mysqli_free_result($vacations);
		$actionResponse['employees'][] = $employeeObj;
	}
	mysqli_free_result($employees);	
	return $actionResponse;	
}


function getVacationEmployeeId($vacation_id) {
	$return_value = null;
	$result = get_sql('select employee_id from vacation where id=?', 98, 's', array($vacation_id));
	if (!$result) {
		$return_value = null; 		
	} else {
		$row = mysqli_fetch_array($result);
		$return_value = $row['employee_id'];		
		mysqli_free_result($result);
	}
	return $return_value;		
}

function getVacationInfoText($vacation_id) {
	$return_value = null;
	$result = get_sql('select concat(u.last_name, " ", substring(u.first_name, 1, 1), ".", substring(u.middle_name, 1, 1), ".") as short_name,
					   date_format(date_add(v.date_begin, interval v.days_count+v.holidays_count-1 day), "%d.%m.%Y") as date_end, 
					   date_format(v.date_begin, "%d.%m.%Y") as date_begin, t.name as type_name 
					   from user as u, employee as e, vacation as v, vacation_type as t 
					   where u.id=e.user_id and t.id=v.type_id and v.employee_id=e.id and v.id=?', 99, 's', array($vacation_id));
	if (!$result) {
		$return_value = null; 		
	} else {
		$row = mysqli_fetch_array($result);
		$return_value = $row['type_name'].' с '.$row['date_begin'].' по '.$row['date_end'].'<br>('.$row['short_name'].')';		
		mysqli_free_result($result);
	}
	return $return_value;	
}

function getNewVacationInfoText($employee_id, $date_begin, $type_id, $days, $holidays) {
$return_value = '';
	$result = get_sql('select concat(u.last_name, " ", substring(u.first_name, 1, 1), ".", substring(u.middle_name, 1, 1), ".") as short_name,
					   date_format(date_add(?, interval ?+?-1 day), "%d.%m.%Y") as date_end, 
					   date_format(?, "%d.%m.%Y") as date_begin, t.name as type_name 
					   from user as u, employee as e
					   left outer join vacation_type as t on t.id=? 
					   where u.id=e.user_id and e.id=?', 100, 'sddsds',  array($date_begin, $days, $holidays, $date_begin, $type_id, $employee_id));
	if (!$result) {
		$return_value = ''; 		
	} else {
		$row = mysqli_fetch_array($result);
		$return_value = $row['type_name'].' с '.$row['date_begin'].' по '.$row['date_end'].'<br>('.$row['short_name'].')';	
		mysqli_free_result($result);
	}
	return $return_value;	
}

function checkVacationApprove($vacation_id) {
	$return_value = false;
	$result = get_sql('select is_approved from vacation where id=?', 101, 's', array($vacation_id));
	if (!$result) {
		$return_value = false; 		
	} else {
		$row = mysqli_fetch_array($result);
		$return_value = $row['is_approved'] == 1; 	
		mysqli_free_result($result);
	}
	return $return_value;	
}

function checkVacationWithoutApproval($vacation_id) {
	$return_value = false;
	$result = get_sql('select t.without_approval from vacation as v, vacation_type as t 
					   where v.type_id= t.id and v.id=?', 102, 's', array($vacation_id));
	if (!$result) {
		$return_value = false; 		
	} else {
		$row = mysqli_fetch_array($result);
		$return_value = $row['without_approval'] == 1; 	
		mysqli_free_result($result);
	}
	return $return_value;	
}

function checkEmployeeNoChief($employee_id, $chief_id) {
	$return_value = false;
	$result = get_sql('select g.chief_id from employee as e, user as u, subdivision as g where u.id=e.user_id and u.subdivision_id=g.id and e.id=?', 103, 's', array($employee_id));
	if (!$result) {
		$return_value = false; 		
	} else {
		$row = mysqli_fetch_array($result);
		$return_value = $row['chief_id'] != $chief_id; 	
		mysqli_free_result($result);
	}
	return $return_value;	
}

function findOldVacation($vacation_id) {
	$return_value = false;
	$result = get_sql('select count(*) as cc from vacation where id=?', 104, 's', array($vacation_id));
	if (!$result) {
		$return_value = false; 		
	} else {
		$row = mysqli_fetch_array($result);
		$return_value = $row['cc'] == 1; 	
		mysqli_free_result($result);
	}
	return $return_value;	
}

function findOthersVacations($employee_id, $new_date_begin, $new_all_days_count, $old_vacation_id) {
	$return_value = null;
	$sqlText = 'select date_format(date_begin, "%d.%m.%Y") as date_begin, 
				date_format(date_add(date_begin, interval days_count+holidays_count-1 day), "%d.%m.%Y") as date_end
				from vacation where employee_id=? and date_begin<=date_add(?, interval ?-1 day) 
				and date_add(date_begin, interval days_count+holidays_count-1 day)>=?';
	$paramsTypes = 'ssds';
	$paramsValues = array($employee_id, $new_date_begin, $new_all_days_count, $new_date_begin);
	if ($old_vacation_id != null) {
		$sqlText .=	' and id<>?';
		$paramsTypes .= 's';
		$paramsValues[] = $old_vacation_id;
	}	
	$result = get_sql($sqlText, 105, $paramsTypes, $paramsValues);
	if (!$result) {
		$return_value = null; 		
	} else {
		$return_value = array();
		while ($vac=mysqli_fetch_array($result)) {			 
			$vacationObj = null;
			$vacationObj['dateBegin'] = $vac['date_begin'];
			$vacationObj['dateEnd'] = $vac['date_end'];
			$return_value[] = $vacationObj;
		}	
		mysqli_free_result($result);
	}
	return $return_value;	
}

function getUserFromEmployee($employee_id) {
	$return_value = null;
	$result = get_sql('select user_id from employee where id=?', 111, 's', array($employee_id));
	if (!$result) {
		$return_value = false; 		
	} else {
		$row = mysqli_fetch_array($result);
		$return_value = $row['user_id']; 	
		mysqli_free_result($result);
	}
	return $return_value;		
}

function getHolidaysCount($date_begin, $all_days_count) {
	$return_value = 0;
	$result = get_sql('select count(*) as cc from work_calendar where day_type_id=1 
					   and date_fix between ? and date_add(?, interval ?-1 day)', 
						106, 'ssd', array($date_begin, $date_begin, $all_days_count));
	if (!$result) {
		$return_value = 0; 		
	} else {
		$row = mysqli_fetch_array($result);
		$return_value = $row['cc']; 	
		mysqli_free_result($result);
	}
	return $return_value;		
}

function changeVacationApprove($actionRequest, $userId) {	
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при согласовании отпуска.';
	$vacInfoText = getVacationInfoText($actionRequest['vacationId']);
	$employeeId = getVacationEmployeeId($actionRequest['vacationId']);
	if (checkVacationWithoutApproval($actionRequest['vacationId'])) {
		$actionResponse['msgText'] = 'Невозможно согласовать отпуск с типом <Без согласования>.';	
	} else if (checkEmployeeNoChief($employeeId, $userId)) {
		$actionResponse['msgText'] = 'Невозможно согласовать отпуск, т.к. вы не являетесь руководителем сотрудника.';	
	} else {			
		$res =exec_sql('update vacation set is_approved=?, date_approved=now() 
						where id=?', 5, 'ds', array($actionRequest['newApproveValue'], $actionRequest['vacationId']));
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при согласовании отпуска.';
			$actionResponse['msgText'] .= '<br>'.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			if ($actionRequest['newApproveValue'] == 1) {
				$actionResponse['msgText'] = 'Отпуск успешно согласован.';
			} else {
				$actionResponse['msgText'] = 'Согласование отпуска успешно отменено.';					
			}	
		}		
	}
	$actionResponse['msgText'] .= '<br><br>'.$vacInfoText;
	return $actionResponse;
}

function correctUnusedVacationDays($employeeId, $newVacationTypeId, $newVacationDays, $oldvacationId) {
	$res = '';
	$days_delta = 0;
	if ($oldvacationId != null) {
		$result = get_sql('select type_id, days_count from vacation where id=?', 93, 's', array($oldvacationId));
		if (!$result) {
			$days_delta = 0; 		
		} else {
			$row = mysqli_fetch_array($result);
			if ($row['type_id'] == 2) {
				$days_delta = $days_delta + $row['days_count'];
			}
			mysqli_free_result($result);
		}		
	}
	if ($newVacationTypeId == 2) {
		$days_delta = $days_delta - $newVacationDays;		
	}
	if ($days_delta != 0) {
		$res = exec_sql('update employee set unused_vacation_days=?+unused_vacation_days where id=?', 94, 'ds', array($days_delta, $employeeId));
	}
	return $res;
}

function addVacation($actionRequest, $userId) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при добавлении отпуска.';
	$vacInfoText = null;	
	
	$othersVacations = findOthersVacations($actionRequest['employeeId'], $actionRequest['dateBegin'], $actionRequest['days'] + $actionRequest['holidays'], null);
	if ($othersVacations != null) {
		$actionResponse['msgText'] = 'Отпуск не добавлен, т.к. он пересекается с запланированным ранее:';
		foreach ($othersVacations as $v) {
			$actionResponse['msgText'] .= '<br> • '.$v['dateBegin'].'-'.$v['dateEnd'];
		}			
	} else if ($userId != getUserFromEmployee($actionRequest['employeeId'])) {
		$actionResponse['msgText'] = 'Отпуск не добавлен, т.к. разрешено добавлять только свои отпуска.';	
	} else {
		$holidays_count = getHolidaysCount($actionRequest['dateBegin'], $actionRequest['days'] + $actionRequest['holidays']);
		$days_count = $actionRequest['days'] + $actionRequest['holidays'] - $holidays_count;
		$res = correctUnusedVacationDays($actionRequest['employeeId'], $actionRequest['typeId'], $days_count, null);
		if ($res == '') {
			$res = exec_sql('insert into vacation (employee_id, date_begin, days_count, holidays_count, type_id, date_create) 
							 values(?, ?, ?, ?, ?, now())', 6, 'ssddd', array($actionRequest['employeeId'], $actionRequest['dateBegin'], 
							 $days_count, $holidays_count, $actionRequest['typeId']));
			$new_id_result = get_sql('select last_insert_id() as id', 6, '', array());
			if (!$new_id_result) {
				$new_id = null; 		
			} else {
				$row = mysqli_fetch_array($new_id_result);
				$new_id = $row['id']; 	
				mysqli_free_result($new_id_result);
			}
		}
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при добавлении отпуска.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Отпуск успешно добавлен.';
			$vacInfoText = getVacationInfoText($new_id);
		}
	}
	if ($vacInfoText == null) {
		$vacInfoText = 'Добавляемый отпуск:<br>'.getNewVacationInfoText($actionRequest['employeeId'], $actionRequest['dateBegin'], 
										  $actionRequest['typeId'], $actionRequest['days'], $actionRequest['holidays']);
	}
	$actionResponse['msgText'] .= '<br><br>'.$vacInfoText;
	return $actionResponse;	
}

function editVacation($actionRequest, $userId) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при редактировании отпуска.';
	$newVacInfoText = null;
	$oldVacInfoText = 'Редактируемый отпуск:<br>'.getVacationInfoText($actionRequest['vacationId']);
	
	$othersVacations = findOthersVacations($actionRequest['employeeId'], $actionRequest['dateBegin'], $actionRequest['days'] + $actionRequest['holidays'], $actionRequest['vacationId']);
	if ($othersVacations != null) {
		$actionResponse['msgText'] = 'Отпуск не изменен, т.к. новый период пересекается с запланированным ранее отпуском:';
		foreach ($othersVacations as $v) {
			$actionResponse['msgText'] .= '<br> • '.$v['dateBegin'].'-'.$v['dateEnd'];
		}			
	} else if ($userId != getUserFromEmployee($actionRequest['employeeId'])) {
		$actionResponse['msgText'] = 'Отпуск не изменен, т.к. разрешено редактировать только свои отпуска.';	
	} else if (checkVacationApprove($actionRequest['vacationId'])) {
		$actionResponse['msgText'] = 'Отпуск не изменен, т.к. разрешено редактировать только несогласованные отпуска.';
	} else if (!findOldVacation($actionRequest['vacationId'])) {
		$actionResponse['msgText'] = 'Отпуск не найден.';
	} else {
		$holidays_count = getHolidaysCount($actionRequest['dateBegin'], $actionRequest['days'] + $actionRequest['holidays']);
		$days_count = $actionRequest['days'] + $actionRequest['holidays'] - $holidays_count;
		$res = correctUnusedVacationDays($actionRequest['employeeId'], $actionRequest['typeId'], $days_count, $actionRequest['vacationId']);
		if ($res == '') {
			$res = exec_sql('update vacation set type_id=?, date_begin=?, days_count=?, holidays_count=?, date_update=now() 
							 where id=?', 7, 'dsdds', array($actionRequest['typeId'], $actionRequest['dateBegin'], 
							 $days_count, $holidays_count, $actionRequest['vacationId']));			
		}
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при редактировании отпуска.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Отпуск успешно изменен.';
			$newVacInfoText = 'Изменен на:<br>'.getVacationInfoText($actionRequest['vacationId']);
		}
	}
	if ($newVacInfoText == null) {
		$newVacInfoText = 'Планируемые изменения:<br>'.getNewVacationInfoText($actionRequest['employeeId'], $actionRequest['dateBegin'], 
										  $actionRequest['typeId'], $actionRequest['days'], $actionRequest['holidays']);
	}
	$actionResponse['msgText'] .= '<br><br>'.$oldVacInfoText.'<br><br>'.$newVacInfoText;
	return $actionResponse;	
}

function deleteVacation($actionRequest, $userId) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при удалении отпуска.';
	$vacInfoText = getVacationInfoText($actionRequest['vacationId']);
	$employeeId = getVacationEmployeeId($actionRequest['vacationId']);	
	
	if ($userId != getUserFromEmployee($employeeId)) {
		$actionResponse['msgText'] = 'Отпуск не удален, т.к. разрешено удалять только свои отпуска.';	
	} else if (checkVacationApprove($actionRequest['vacationId'])) {
		$actionResponse['msgText'] = 'Отпуск не удален, т.к. разрешено удалять только несогласованные отпуска.';
	} else if (!findOldVacation($actionRequest['vacationId'])) {
		$actionResponse['msgText'] = 'Отпуск не найден.';
	} else {
		$res = correctUnusedVacationDays($employeeId, null, 0, $actionRequest['vacationId']);		
		if ($res == '') {
			$res = exec_sql('delete from vacation where id=?', 8, 's', array($actionRequest['vacationId']));			
		}
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при удалении отпуска.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Отпуск успешно удален.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$vacInfoText = 'Удаляемый отпуск:<br>'.$vacInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$vacInfoText;
	return $actionResponse;	
}

?>