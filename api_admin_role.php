<?php
session_start();
require_once 'auth.php';
require_once 'global_params.php';
require_once 'connection.php';


function getAdminRoleApiMethod($actionRequest, $userId) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	$result = get_sql('SELECT count(*) cc FROM user_in_right WHERE right_id=100 AND user_id=?', 0, 'd', array($userId));
	if (!$result) {
		$actionResponse['msgStatus'] = 'danger';
		$actionResponse['msgText'] = 'Произошла ошибка.';
	} else {
		$row = mysqli_fetch_array($result);
		if ($row['cc'] == 1) {
			switch ($actionName) {
				case 'getRoles':
					$actionResponse = getRoles($actionRequest);
					break;
				case 'addRole':
					$actionResponse = addRole($actionRequest);
					break;	
				case 'editRole':
					$actionResponse = editRole($actionRequest);
					break;	
				case 'deleteRole':
					$actionResponse = deleteRole($actionRequest);
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

function getRoles($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['data'] = array();
	$roles = get_sql('SELECT id, name, short_name, internal_uid FROM group_role ORDER BY id', 1, '', array());
	while ($role = mysqli_fetch_array($roles)) {
		$val = array();
		$val['id'] = $role[0];
		$val['name'] = $role[1];
		$val['short_name'] = $role[2];
		$val['internal_uid'] = $role[3];
		$actionResponse['data'][] = $val;
	}
	mysqli_free_result($roles);
	return $actionResponse;	
}

function getRoleInfoText($roleId) {
	$returnValue = null;
	$result = get_sql('SELECT CONCAT(name, " (id=", id, ")") AS name FROM group_role WHERE id=?', 2, 's', array($roleId));
	if (!$result) {
		$returnValue = null; 		
	} else {
		$row = mysqli_fetch_array($result);
		$returnValue = $row['name'];		
		mysqli_free_result($result);
	}
	return $returnValue;	
}

function checkRoleName($roleName, $roleId) {
	$returnValue = '';	
	if (trim($roleName) == '') {
		$returnValue = 'Заполните наименование роли.'; 		
	} else {
		$result = get_sql('SELECT id FROM group_role WHERE TRIM(name)=TRIM(?) AND id<>?', 3, 'ss', array($roleName, $roleId));
		if (!$result) {
			$returnValue = 'Произошла ошибка при проверке дублирования роли.'; 		
		} else {
			$row = mysqli_fetch_array($result);
			if ($row['id'] != '') {
				$returnValue = 'Роль уже существует (id='.$row['id'].')';
			}
			mysqli_free_result($result);
		}
	}
	return $returnValue;
}

function addRole($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при добавлении роли.';
	$roleInfoText = $actionRequest['roleName'];
	
	$res = checkRoleName($actionRequest['roleName'], -1);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {
		$new_id_result = get_sql('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM group_role', 4, '', array());
		if (!$new_id_result) {
			$roleId = null;
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при получении нового id роли.';
		} else {
			$row = mysqli_fetch_array($new_id_result);
			$roleId = $row['id']; 	
			mysqli_free_result($new_id_result);
		}		
		if ($roleId != null) {
			$res = exec_sql('INSERT INTO group_role(id, name, short_name, internal_uid) VALUES(?, TRIM(?), TRIM(?), TRIM(?))', 5, 'ssss', 
			  array($roleId, $actionRequest['roleName'], $actionRequest['roleShortName'], $actionRequest['roleInternalUid']));			
			if ($res != '') {
				$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при добавлении роли.';
				$actionResponse['msgText'] .= '<br> • '.$res;		
			} else {
				$actionResponse['msgStatus'] = 'success';
				$actionResponse['msgText'] = 'Роль успешно добавлена.';
			}
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$roleInfoText = 'Добавляемая роль:<br>'.$roleInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$roleInfoText;
	return $actionResponse;	
}

function editRole($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при редактировании роли.';
	$roleInfoText = getRoleInfoText($actionRequest['roleId']);
	
	$res = checkRoleName($actionRequest['roleName'], $actionRequest['cityId']);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {		
		$res = exec_sql('UPDATE group_role SET name=TRIM(?), short_name=TRIM(?), internal_uid=TRIM(?) WHERE id=?', 6, 'ssss', 
		  array($actionRequest['roleName'], $actionRequest['roleShortName'], $actionRequest['roleInternalUid'], $actionRequest['roleId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при редактировании роли.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Роль успешно изменена.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$roleInfoText = 'Редактируемая роль:<br>'.$roleInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$roleInfoText;
	return $actionResponse;	
}

function deleteRole($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при удалении роли.';
	$roleInfoText = getRoleInfoText($actionRequest['roleId']);
	
	if ($roleInfoText == null) {
		$actionResponse['msgText'] = 'Роль не найдена.';	
	} else {
		$res = exec_sql('DELETE FROM group_role WHERE id=?', 7, 's', array($actionRequest['roleId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при удалении роли.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Роль успешно удалена.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$roleInfoText = 'Удаляемая роль:<br>'.$roleInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$roleInfoText;
	return $actionResponse;	
}
	

?>