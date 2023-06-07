<?php
session_start();
require_once 'auth.php';
require_once 'global_params.php';
require_once 'connection.php';


function getAdminJobApiMethod($actionRequest, $userId) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	$result = get_sql('SELECT count(*) cc FROM user_in_right WHERE right_id=100 AND user_id=?', 0, 'd', array($userId));
	if (!$result) {
		$actionResponse['msgStatus'] = 'danger';
		$actionResponse['msgText'] = 'Произошла ошибка.';
	} else {
		$row = mysqli_fetch_array($result);
		if ($row['cc'] == 1) {
			switch ($actionName) {
				case 'getJobs':
					$actionResponse = getJobs($actionRequest);
					break;
				case 'addJob':
					$actionResponse = addJob($actionRequest);
					break;	
				case 'editJob':
					$actionResponse = editJob($actionRequest);
					break;	
				case 'deleteJob':
					$actionResponse = deleteJob($actionRequest);
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

function getJobs($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['data'] = array();
	$jobs = get_sql('SELECT id, name, name_for_print, internal_uid FROM job ORDER BY id', 1, '', array());
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

function getJobInfoText($jobId) {
	$returnValue = null;
	$result = get_sql('SELECT CONCAT(name, " (id=", id, ")") AS name FROM job WHERE id=?', 2, 's', array($jobId));
	if (!$result) {
		$returnValue = null; 		
	} else {
		$row = mysqli_fetch_array($result);
		$returnValue = $row['name'];		
		mysqli_free_result($result);
	}
	return $returnValue;	
}

function checkJobName($jobName, $jobId) {
	$returnValue = '';	
	if (trim($jobName) == '') {
		$returnValue = 'Заполните наименование должности.'; 		
	} else {
		$result = get_sql('SELECT id FROM job WHERE TRIM(name)=TRIM(?) AND id<>?', 3, 'ss', array($jobName, $jobId));
		if (!$result) {
			$returnValue = 'Произошла ошибка при проверке дублирования должности.'; 		
		} else {
			$row = mysqli_fetch_array($result);
			if ($row['id'] != '') {
				$returnValue = 'Должность уже существует (id='.$row['id'].')';
			}
			mysqli_free_result($result);
		}
	}
	return $returnValue;
}

function addJob($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при добавлении должности.';
	$jobInfoText = $actionRequest['jobName'];
	
	$res = checkJobName($actionRequest['jobName'], -1);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {
		$new_id_result = get_sql('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM job', 4, '', array());
		if (!$new_id_result) {
			$jobId = null;
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при получении новой id должности.';
		} else {
			$row = mysqli_fetch_array($new_id_result);
			$jobId = $row['id']; 	
			mysqli_free_result($new_id_result);
		}		
		if ($jobId != null) {
			$res = exec_sql('INSERT INTO job(id, name, name_for_print, internal_uid) VALUES(?, TRIM(?), TRIM(?), TRIM(?))', 5, 'ssss', 
			  array($jobId, $actionRequest['jobName'], $actionRequest['jobNameForPrint'], $actionRequest['jobInternalUid']));			
			if ($res != '') {
				$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при добавлении должности.';
				$actionResponse['msgText'] .= '<br> • '.$res;		
			} else {
				$actionResponse['msgStatus'] = 'success';
				$actionResponse['msgText'] = 'Должность успешно добавлена.';
			}
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$jobInfoText = 'Добавляемая должность:<br>'.$jobInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$jobInfoText;
	return $actionResponse;	
}

function editJob($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при редактировании должности.';
	$jobInfoText = getJobInfoText($actionRequest['jobId']);
	
	$res = checkJobName($actionRequest['jobName'], $actionRequest['jobId']);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {		
		$res = exec_sql('UPDATE job SET name=TRIM(?), name_for_print=TRIM(?), internal_uid=TRIM(?) WHERE id=?', 6, 'ssss', 
		  array($actionRequest['jobName'], $actionRequest['jobNameForPrint'], $actionRequest['jobInternalUid'], $actionRequest['jobId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при редактировании должности.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Должность успешно изменена.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$jobInfoText = 'Редактируемая должность:<br>'.$jobInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$jobInfoText;
	return $actionResponse;	
}

function deleteJob($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при удалении должности.';
	$jobInfoText = getJobInfoText($actionRequest['jobId']);
	
	if ($jobInfoText == null) {
		$actionResponse['msgText'] = 'Должность не найдена.';	
	} else {
		$res = exec_sql('DELETE FROM job WHERE id=?', 7, 's', array($actionRequest['jobId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при удалении должности.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Должность успешно удалена.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$jobInfoText = 'Удаляемая должность:<br>'.$jobInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$jobInfoText;
	return $actionResponse;	
}
	

?>