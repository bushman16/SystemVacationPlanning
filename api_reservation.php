<?php
require_once 'global_params.php';
require_once 'connection.php';


function getReservationApiMethod($actionRequest, $userId, $auth) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	switch ($actionName) {
		case 'getWorkplaces':
			$actionResponse = getWorkplaces($actionRequest);
			break;			
		case 'getReservations':
			$actionResponse = getReservations($actionRequest, $userId);
			break;
		case 'addReservation':
			$actionResponse = addReservation($actionRequest, $userId);
			break;
		case 'editReservation':
			$actionResponse = editReservation($actionRequest, $userId);
			break;				
		case 'deleteReservation':
			$actionResponse = deleteReservation($actionRequest, $userId);
			break;	
		default:
			$actionResponse['msgStatus'] = 'danger';
			$actionResponse['msgText'] = 'Неизвестный метод.';
			break;	
	}
	return $actionResponse;		
}

function getWorkplaces($actionRequest) {
	$actionResponse = array();
	$actionResponse['inputRequest'] = $actionRequest;
	$locationId = isset($actionRequest['location_id']) ? $actionRequest['location_id'] : 2;
	
	$actionResponse['location'] = array();
	$location = get_sql('select id, name from location where id=?', 2, 'd', array($locationId));
	$row = mysqli_fetch_array($location);
	$actionResponse['location']['id'] = $row[0];
	$actionResponse['location']['name'] = $row[1];
	mysqli_free_result($location);
	
	$actionResponse['equipment'] = array();
	$equipment = get_sql('select id, name from equipment order by order_num', 3, '', array());
	while ($eq = mysqli_fetch_array($equipment)) {
		$val =  array();
		$val['id'] = $eq[0];
		$val['name'] = $eq[1];
		$actionResponse['equipment'][] = $val;
	}
	mysqli_free_result($equipment);
	
	$actionResponse['rooms'] = array();
	$rooms = get_sql('select id, name, is_meeting from room where location_id=? order by order_num', 4, 's', array($locationId));
	while ($room = mysqli_fetch_array($rooms)) {
		$roomVal =  array();
		$roomVal['id'] = $room[0];
		$roomVal['name'] = $room[1];
		$roomVal['is_meeting'] = $room[2];		
		$roomVal['workspaces'] = array();
		$workplaces = get_sql('select id, name, letter from workplace where room_id=? order by order_num', 5, 's', array($room[0]));
		while ($workplace = mysqli_fetch_array($workplaces)) {
			$wsVal =  array();
			$wsVal['id'] = $workplace[0];
			$wsVal['name'] = $workplace[1];
			$wsVal['letter'] = $workplace[2];
			$roomVal['workspaces'][] = $wsVal;
		}
		mysqli_free_result($workplaces);
		
		$actionResponse['rooms'][] = $roomVal;
	}
	mysqli_free_result($rooms);
	
	return $actionResponse;	
}

function getReservations($actionRequest, $userId) {
	$actionResponse = array();	
	$actionResponse['inputRequest'] = $actionRequest;
	$dateBegin = isset($actionRequest['reserve_begin']) ? $actionRequest['reserve_begin'] : date('Y-m-d');
	$dateEnd = isset($actionRequest['reserve_end']) ? $actionRequest['reserve_end'] : date('Y-m-d', strtotime(' +60 day'));
	
	$actionResponse['dateBegin'] = $dateBegin;
	$actionResponse['dateEnd'] = $dateEnd;
	
	$actionResponse['reservations'] = array();
	$reservations = get_sql('select id, employee_id, workplace_id, reserve_begin, reserve_end from workplace_reserve
							 where reserve_begin>=? and reserve_end<=?', 1, 'ss', array($dateBegin, $dateEnd));
	while ($reservation=mysqli_fetch_array($reservations)) {
		$val = array();		 
		$val['id'] = $reservation['id'];
		$val['employee_id'] = $reservation['employee_id'];
		$val['workplace_id'] = $reservation['workplace_id'];
		$val['reserve_begin'] = $reservation['reserve_begin'];
		$val['reserve_end'] = $reservation['reserve_end'];
		$actionResponse['reservations'][] = $val;
	}
	mysqli_free_result($reservations);
	
	return $actionResponse;	
}

function addReservation($actionRequest, $userId) {
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
	} else if ($userId != $actionRequest['employeeId']) {
		$actionResponse['msgText'] = 'Отпуск не добавлен, т.к. разрешено добавлять только свои отпуска.';	
	} else {
		$holidays_count = getHolidaysCount($actionRequest['dateBegin'], $actionRequest['days'] + $actionRequest['holidays']);
		$days_count = $actionRequest['days'] + $actionRequest['holidays'] - $holidays_count;
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

function editReservation($actionRequest, $userId) {
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
	} else if ($userId != $actionRequest['employeeId']) {
		$actionResponse['msgText'] = 'Отпуск не изменен, т.к. разрешено редактировать только свои отпуска.';	
	} else if (checkVacationApprove($actionRequest['vacationId'])) {
		$actionResponse['msgText'] = 'Отпуск не изменен, т.к. разрешено редактировать только несогласованные отпуска.';
	} else if (!findOldVacation($actionRequest['vacationId'])) {
		$actionResponse['msgText'] = 'Отпуск не найден.';
	} else {
		$holidays_count = getHolidaysCount($actionRequest['dateBegin'], $actionRequest['days'] + $actionRequest['holidays']);
		$days_count = $actionRequest['days'] + $actionRequest['holidays'] - $holidays_count;
		$res = exec_sql('update vacation set type_id=?, date_begin=?, days_count=?, holidays_count=?, date_update=now() 
						 where id=?', 7, 'dsdds', array($actionRequest['typeId'], $actionRequest['dateBegin'], 
						 $days_count, $holidays_count, $actionRequest['vacationId']));
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

function deleteReservation($actionRequest, $userId) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при удалении отпуска.';
	$vacInfoText = getVacationInfoText($actionRequest['vacationId']);
	$employeeId = getVacationEmployeeId($actionRequest['vacationId']);	
	
	if ($userId != $employeeId) {
		$actionResponse['msgText'] = 'Отпуск не удален, т.к. разрешено удалять только свои отпуска.';	
	} else if (checkVacationApprove($actionRequest['vacationId'])) {
		$actionResponse['msgText'] = 'Отпуск не удален, т.к. разрешено удалять только несогласованные отпуска.';
	} else if (!findOldVacation($actionRequest['vacationId'])) {
		$actionResponse['msgText'] = 'Отпуск не найден.';
	} else {
		$res = exec_sql('delete from vacation where id=?', 8, 's', array($actionRequest['vacationId']));
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