<?php
session_start();
require_once 'auth.php';
require_once 'global_params.php';
require_once 'connection.php';


function getAdminOrganizationApiMethod($actionRequest, $userId) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	$result = get_sql('SELECT count(*) cc FROM user_in_right WHERE right_id=100 AND user_id=?', 0, 'd', array($userId));
	if (!$result) {
		$actionResponse['msgStatus'] = 'danger';
		$actionResponse['msgText'] = 'Произошла ошибка.';
	} else {
		$row = mysqli_fetch_array($result);
		if ($row['cc'] == 1) {
			switch ($actionName) {
				case 'getOrganizations':
					$actionResponse = getOrganizations($actionRequest);
					break;
				case 'addOrganization':
					$actionResponse = addOrganization($actionRequest);
					break;	
				case 'editOrganization':
					$actionResponse = editOrganization($actionRequest);
					break;	
				case 'deleteOrganization':
					$actionResponse = deleteOrganization($actionRequest);
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

function getOrganizations($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['data'] = array();
	$organizations = get_sql('SELECT id, name, short_name, text_for_print, internal_uid FROM organization ORDER BY id', 1, '', array());
	while ($organization = mysqli_fetch_array($organizations)) {
		$val = array();
		$val['id'] = $organization[0];
		$val['name'] = $organization[1];
		$val['short_name'] = $organization[2];
		$val['text_for_print'] = $organization[3];
		$val['internal_uid'] = $organization[4];
		$actionResponse['data'][] = $val;
	}
	mysqli_free_result($organizations);
	return $actionResponse;	
}

function getOrganizationInfoText($organizationId) {
	$returnValue = null;
	$result = get_sql('SELECT CONCAT(name, " (id=", id, ")") AS name FROM organization WHERE id=?', 2, 's', array($organizationId));
	if (!$result) {
		$returnValue = null; 		
	} else {
		$row = mysqli_fetch_array($result);
		$returnValue = $row['name'];		
		mysqli_free_result($result);
	}
	return $returnValue;	
}

function checkOrganizationName($organizationName, $organizationId) {
	$returnValue = '';	
	if (trim($organizationName) == '') {
		$returnValue = 'Заполните наименование организации.'; 		
	} else {
		$result = get_sql('SELECT id FROM organization WHERE TRIM(name)=TRIM(?) AND id<>?', 4, 'ss', array($organizationName, $organizationId));
		if (!$result) {
			$returnValue = 'Произошла ошибка при проверке дублирования организации.'; 		
		} else {
			$row = mysqli_fetch_array($result);
			if ($row['id'] != '') {
				$returnValue = 'Организация уже существует (id='.$row['id'].')';
			}
			mysqli_free_result($result);
		}
	}
	return $returnValue;
}

function addOrganization($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при добавлении организации.';
	$cityInfoText = $actionRequest['organizationName'];
	
	$res = checkOrganizationName($actionRequest['organizationName'], -1);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {
		$new_id_result = get_sql('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM organization', 5, '', array());
		if (!$new_id_result) {
			$organizationId = null;
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при получении нового id организации.';
		} else {
			$row = mysqli_fetch_array($new_id_result);
			$organizationId = $row['id']; 	
			mysqli_free_result($new_id_result);
		}		
		if ($organizationId != null) {
			$res = exec_sql('INSERT INTO organization(id, name, short_name, text_for_print, internal_uid) VALUES(?, TRIM(?), TRIM(?), TRIM(?), TRIM(?))', 6, 'sssss', 
			  array($organizationId, $actionRequest['organizationName'], $actionRequest['organizationShortName'], $actionRequest['organizationTextForPrint'], $actionRequest['organizationInternalUid']));			
			if ($res != '') {
				$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при добавлении организация.';
				$actionResponse['msgText'] .= '<br> • '.$res;		
			} else {
				$actionResponse['msgStatus'] = 'success';
				$actionResponse['msgText'] = 'Организация успешно добавлена.';
			}
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$organizationInfoText = 'Добавляемая организация:<br>'.$organizationInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$organizationInfoText;
	return $actionResponse;	
}

function editOrganization($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при редактировании организации.';
	$organizationInfoText = getOrganizationInfoText($actionRequest['organizationId']);
	
	$res = checkOrganizationName($actionRequest['organizationName'], $actionRequest['organizationId']);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {		
		$res = exec_sql('UPDATE organization SET name=TRIM(?), short_name=TRIM(?), text_for_print=TRIM(?), internal_uid=TRIM(?) WHERE id=?', 7, 'sssss', 
		  array($actionRequest['organizationName'], $actionRequest['organizationShortName'], $actionRequest['organizationTextForPrint'], $actionRequest['organizationInternalUid'], $actionRequest['organizationId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при редактировании организации.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Организация успешно изменена.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$organizationInfoText = 'Редактируемая организация:<br>'.$organizationInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$organizationInfoText;
	return $actionResponse;	
}

function deleteOrganization($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при удалении организации.';
	$organizationInfoText = getOrganizationInfoText($actionRequest['organizationId']);
	
	if ($organizationInfoText == null) {
		$actionResponse['msgText'] = 'Организация не найдена.';	
	} else {
		$res = exec_sql('DELETE FROM organization WHERE id=?', 8, 's', array($actionRequest['organizationId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при удалении организации.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Организация успешно удалена.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$organizationInfoText = 'Удаляемая организация:<br>'.$organizationInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$organizationInfoText;
	return $actionResponse;	
}
	

?>