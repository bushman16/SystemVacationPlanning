<?php
session_start();
require_once 'auth.php';
require_once 'global_params.php';
require_once 'connection.php';


function getAdminApiMethod($actionRequest, $userId) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	$result = get_sql('SELECT count(*) cc FROM user_in_right WHERE right_id=100 and user_id=?', 0, 'd', array($userId));
	if (!$result) {
		$actionResponse['msgStatus'] = 'danger';
		$actionResponse['msgText'] = 'Произошла ошибка.';
	} else {
		$row = mysqli_fetch_array($result);
		if ($row['cc'] == 1) {
			switch ($actionName) {
				case 'backup':
					$actionResponse = startBackup($actionRequest);
					break;
				case 'getJobDictionary':
					$actionResponse = getJobDictionary($actionRequest);
					break;				
				default:
					$actionResponse['msgStatus'] = 'danger';
					$actionResponse['msgText'] = 'Неизвестный метод.';
					break;	
			}
		} else {
			$actionResponse['msgStatus'] = 'danger';
			$actionResponse['msgText'] = 'Отсутствуют права администратора.';				
		}
		mysqli_free_result($result);
	}	
	return $actionResponse;		
}

function startBackup($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	create_dump();
	$actionResponse['msgStatus'] = 'success';
	$actionResponse['msgText'] = 'Резервная копия успешно создана.';
	return $actionResponse;	
}

function getJobDictionary($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['data'] = array();
	$jobs = get_sql('select id, name, name_for_print, internal_uid from job order by id', 0, '', array());
	while ($job = mysqli_fetch_array($jobs)) {
		$val = array();
		$val['id'] = $job[0];
		$val['name'] = $job[1];
		$val['name_for_print'] = $job[2];
		$val['internal_uid'] = $job[3];
		$actionResponse['data'][] = $val;
	}
	mysqli_free_result($jobs);
	return $actionResponse;	
}
	

?>