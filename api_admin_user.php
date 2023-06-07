<?php
session_start();
require_once 'auth.php';
require_once 'global_params.php';
require_once 'connection.php';


function getAdminUserApiMethod($actionRequest, $userId) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	$result = get_sql('SELECT count(*) cc FROM user_in_right WHERE right_id=100 AND user_id=?', 0, 'd', array($userId));
	if (!$result) {
		$actionResponse['msgStatus'] = 'danger';
		$actionResponse['msgText'] = 'Произошла ошибка.';
	} else {
		$row = mysqli_fetch_array($result);
		if ($row['cc'] == 1) {
			switch ($actionName) {
				case 'getUsers':
					$actionResponse = getUsers($actionRequest);
					break;
				case 'getDivisionName':
					$actionResponse = getDivisionName($actionRequest);
					break;
				case 'getCityName':
					$actionResponse = getCityName($actionRequest);
					break;
				case 'addUser':
					$actionResponse = addUser($actionRequest);
					break;	
				case 'editUser':
					$actionResponse = editUser($actionRequest);
					break;	
				case 'deleteUser':
					$actionResponse = deleteUser($actionRequest);
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

function getUsers($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['data'] = array();
	$users = get_sql('SELECT p.id, login, internal_uid, last_name, last_name_for_print, first_name, middle_name, date_create, date_close, is_male, b.name as nameDivision, c.name as nameCity FROM `user` p Join `subdivision` b ON p.subdivision_id = b.id Join `city` c ON p.city_id = c.id ORDER BY id', 1, '', array());
	while ($user = mysqli_fetch_array($users)) {
		$val = array();
		$val['id'] = $user[0];
		$val['login'] = $user[1];
		$val['internal_uid'] = $user[2];
		$val['last_name'] = $user[3];
		$val['last_name_for_print'] = $user[4];
		$val['first_name'] = $user[5];
		$val['middle_name'] = $user[6];
		$val['date_create'] = $user[7];
		$val['date_close'] = $user[8];
		$val['is_male'] = $user[9];
		$val['nameDivision'] = $user[10];
		$val['nameCity'] = $user[11];
		$actionResponse['data'][] = $val;
	}
	mysqli_free_result($users);
	return $actionResponse;	
}

function getCityName($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['city'] = array();
	$cities = get_sql('SELECT id, name FROM city ', 1, '', array());
	while ($city = mysqli_fetch_array($cities)) {
		$val = array();
		$val['id'] = $city[0];
		$val['name'] = $city[1];
		$actionResponse['city'][] = $val;
	}
	mysqli_free_result($cities);
	return $actionResponse;	
}

function getDivisionName($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['division'] = array();
	$divisions = get_sql('SELECT id, name FROM subdivision ', 1, '', array());
	while ($division = mysqli_fetch_array($divisions)) {
		$val = array();
		$val['id'] = $division[0];
		$val['name'] = $division[1];
		$actionResponse['division'][] = $val;
	}
	mysqli_free_result($divisions);
	return $actionResponse;	
}

function getUserInfoText($userId) {
	$returnValue = null;
	$result = get_sql('SELECT CONCAT(login, " (id=", id, ")") AS login FROM user WHERE id=?', 2, 's', array($userId));
	if (!$result) {
		$returnValue = null; 		
	} else {
		$row = mysqli_fetch_array($result);
		$returnValue = $row['login'];		
		mysqli_free_result($result);
	}
	return $returnValue;	
}

function checkUserName($userLogin, $userId) {
	$returnValue = '';	
	if (trim($userLogin) == '') {
		$returnValue = 'Заполните логин сотрудника.'; 		
	} else {
		$result = get_sql('SELECT id FROM user WHERE TRIM(login)=TRIM(?) AND id<>?', 3, 'ss', array($userLogin, $userId));
		if (!$result) {
			$returnValue = 'Произошла ошибка при проверке логина сотрудника.'; 		
		} else {
			$row = mysqli_fetch_array($result);
			if ($row['id'] != '') {
				$returnValue = 'Логин уже существует (id='.$row['id'].')';
			}
			mysqli_free_result($result);
		}
	}
	return $returnValue;
}

function addUser($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при добавлении сотрудника.';
	$userInfoText = $actionRequest['userLogin'];
	
	$res = checkUserName($actionRequest['userLogin'], -1);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {
		$new_id_result = get_sql('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM user', 4, '', array());
		$new_order_num_result = get_sql('SELECT COALESCE(MAX(order_num), 0) + 1 AS order_num FROM user', 5, '', array());
		if (!$new_id_result) {
			$userId = null;
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при получении нового id сотрудника.';
		} else {
			$row = mysqli_fetch_array($new_id_result);
			$userId = $row['id']; 	
			mysqli_free_result($new_id_result);
			
			$row = mysqli_fetch_array($new_order_num_result);
			$userOrderNum = $row['order_num']; 	
			mysqli_free_result($new_order_num_result);
		}		
		if ($userId != null) {
			$res = exec_sql('INSERT INTO user(id, login, internal_uid, last_name, last_name_for_print, first_name, middle_name, subdivision_id, city_id, date_create, date_close, is_male, order_num, settings_data) VALUES(?, TRIM(?), TRIM(?), TRIM(?), TRIM(?), TRIM(?), TRIM(?), TRIM(?), TRIM(?), TRIM(?), TRIM(?), ?, ?, TRIM(?))', 6, 'ssssssssssssss', 
			  array($userId, $actionRequest['userLogin'], $actionRequest['userInternalUid'], $actionRequest['userLastName'], $actionRequest['userLastNameForPrint'], $actionRequest['userFirstName'], $actionRequest['userMiddleName'], $actionRequest['userNameDivision'], $actionRequest['userNameCity'], $actionRequest['userDateCreate'], $actionRequest['userDateClose'], $actionRequest['isMale'], $userOrderNum, $actionRequest['userSettingsData']));			
			if ($res != '') {
				$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при добавлении сотрудника.';
				$actionResponse['msgText'] .= '<br> • '.$res;		
			} else {
				$actionResponse['msgStatus'] = 'success';
				$actionResponse['msgText'] = 'Сотрудник успешно добавлен.';
			}
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$userInfoText = 'Добавляемый сотрудник:<br>'.$userInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$userInfoText;
	return $actionResponse;	
}

function editUser($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при редактировании сотрудника.';
	$userInfoText = getUserInfoText($actionRequest['userId']);
	
	$res = checkUserName($actionRequest['userLogin'], $actionRequest['userId']);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {
		$order_num_result = get_sql('SELECT order_num AS order_num FROM user WHERE id=?', 7, 's', array($actionRequest['userId']));	
		$row = mysqli_fetch_array($order_num_result);
		$userOrderNum = $row['order_num']; 	
		mysqli_free_result($order_num_result);
		
		/* $internal_uid_result = get_sql('SELECT internal_uid AS internal_uid FROM user WHERE id=?', 8, 's', array($actionRequest['userId']));	
		$row = mysqli_fetch_array($internal_uid_result);
		$userInternalUid = $row['internal_uid']; 	
		mysqli_free_result($internal_uid_result); */
		
		$settings_data_result = get_sql('SELECT settings_data AS settings_data FROM user WHERE id=?', 9, 's', array($actionRequest['userId']));	
		$row = mysqli_fetch_array($settings_data_result);
		$userSettingsData = $row['settings_data']; 	
		mysqli_free_result($settings_data_result);
		
		$res = exec_sql('UPDATE user SET login=TRIM(?), internal_uid=TRIM(?), last_name=TRIM(?), last_name_for_print=TRIM(?), first_name=TRIM(?), middle_name=TRIM(?), subdivision_id=TRIM(?), city_id=TRIM(?), date_create=TRIM(?), date_close=TRIM(?), is_male=?, order_num=TRIM(?), settings_data=TRIM(?) WHERE id=?', 7, 'ssssssssssssss', 
		  array($actionRequest['userLogin'], $actionRequest['userInternalUid'], $actionRequest['userLastName'], $actionRequest['userLastNameForPrint'], $actionRequest['userFirstName'], $actionRequest['userMiddleName'], $actionRequest['userNameDivision'], $actionRequest['userNameCity'], $actionRequest['userDateCreate'], $actionRequest['userDateClose'], $actionRequest['isMale'], $userOrderNum, $userSettingsData, $actionRequest['userId']));	
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при редактировании сотрудника.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Сотрудник успешно изменен.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$userInfoText = 'Редактируемый Сотрудник:<br>'.$userInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$userInfoText;
	return $actionResponse;	
}

function deleteUser($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при удалении сотрудника.';
	$userInfoText = getUserInfoText($actionRequest['userId']);
	
	if ($userInfoText == null) {
		$actionResponse['msgText'] = 'Сотрудник не найден.';	
	} else {
		$res = exec_sql('DELETE FROM user WHERE id=?', 8, 's', array($actionRequest['userId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при удалении сотрудника.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Сотрудник успешно удален.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$userInfoText = 'Удаляемый сотрудник:<br>'.$userInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$userInfoText;
	return $actionResponse;	
}
	

?>