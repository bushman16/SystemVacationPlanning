<?php
session_start();
require_once 'auth.php';
require_once 'global_params.php';
require_once 'connection.php';


function getEmployeeApiMethod($actionRequest, $userId) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	switch ($actionName) {
		case 'getUserInfo':
			$actionResponse =  getUserInfo($actionRequest, $userId);
			break;	
		default:
			$actionResponse['msgStatus'] = 'danger';
			$actionResponse['msgText'] = 'Неизвестный метод.';
			break;	
	}
	return $actionResponse;		
}

function getUserInfo($actionRequest, $userId) {
	$actionResponse['inputRequest'] = $actionRequest;
	$curUserId = isset($actionRequest['userId']) ? $actionRequest['userId'] : null;
	if ($curUserId == null) {
		//$actionResponse['msgStatus'] = 'danger';
		//$actionResponse['msgText'] = 'Сотрудник не определен.';
		//return $actionResponse;
		$curUserId = $userId;		
	}
	$users = get_sql('select u.id, u.last_name, u.first_name, u.middle_name, ifnull(l.name, "-") as city, 
					  c.chief_name, c.subdivision
					  from user as u 
					  left outer join city as l on l.id=u.city_id
					  left outer join (select g2.id, ifnull(concat(u2.last_name, " ", substring(u2.first_name, 1, 1), ".", 
					  substring(u2.middle_name, 1, 1), "."), "-") as chief_name, 
					  ifnull(g2.name, "-") as subdivision from subdivision as g2
						left outer join user as u2 on u2.id=g2.chief_id) as c on c.id=u.subdivision_id
					  where u.id=?', 0, 'd', array($curUserId));
	$user = mysqli_fetch_array($users);
	$actionResponse['user'] = array();
	$actionResponse['user']['id'] = $user['id'];
	$actionResponse['user']['last_name'] = $user['last_name'];
	$actionResponse['user']['first_name'] = $user['first_name'];
	$actionResponse['user']['middle_name'] = $user['middle_name'];
	$actionResponse['user']['location'] = $user['city'];		
	$actionResponse['user']['chief_name'] = $user['chief_name'];
	$actionResponse['user']['subdivision'] = $user['subdivision'];
	$actionResponse['user']['employees'] = array();	
	mysqli_free_result($users);
	
	$employees = get_sql('select e.id, j.name as job_name, o.name as org_name
					  from employee as e 
					  left outer join job as j on j.id=e.job_id
					  left outer join organization as o on o.id=e.organization_id
					  where e.user_id=?
					  order by o.id', 1, 'd', array($curUserId));
	while ($employee = mysqli_fetch_array($employees)) {
		$employee_json = array();
		$employee_json['id'] = $employee['id'];
		$employee_json['org_name'] = $employee['org_name'];
		$employee_json['job_name'] = $employee['job_name'];
		$actionResponse['user']['employees'][] = $employee_json;
	}	
	mysqli_free_result($employees);
	
	if ($curUserId == $userId) {
		$groups = get_sql('select t.id as group_type_id, t.name as group_type_name, 
						g.name as group_name, r.name as role_name, u.is_teamlead, u.date_begin, u.date_end,
						ifnull(c.name, "-") as group_chief_name
						from user_in_group u, group_role r, work_group_type t, work_group g
						left outer join (select id, concat(last_name, " ", substring(first_name, 1, 1), ".", 
						substring(middle_name, 1, 1), ".") as name from user) as c on c.id=g.chief_id 
						where u.user_id=? and u.group_id=g.id and u.role_id=r.id
						and t.id=g.group_type_id
						order by t.id, u.date_begin, u.date_end', 2, 'd', array($curUserId));
		while ($group = mysqli_fetch_array($groups)) {
			$group_json = array();
			$group_json['group_type_id'] = $group['group_type_id'];
			$group_json['group_type_name'] = $group['group_type_name'];
			$group_json['group_name'] = $group['group_name'];
			$group_json['role_name'] = $group['role_name'];			
			$group_json['is_teamlead'] = $group['is_teamlead'];
			$group_json['date_begin'] = $group['date_begin'];
			$group_json['date_end'] = $group['date_end'];
			$group_json['group_chief_name'] = $group['group_chief_name'];
			$actionResponse['user']['groups'][] = $group_json;
		}	
		mysqli_free_result($groups);		
	}
	return $actionResponse;	
}


?>