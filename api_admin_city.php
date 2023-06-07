<?php
session_start();
require_once 'auth.php';
require_once 'global_params.php';
require_once 'connection.php';


function getAdminCityApiMethod($actionRequest, $userId) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	$result = get_sql('SELECT count(*) cc FROM user_in_right WHERE right_id=100 AND user_id=?', 0, 'd', array($userId));
	if (!$result) {
		$actionResponse['msgStatus'] = 'danger';
		$actionResponse['msgText'] = 'Произошла ошибка.';
	} else {
		$row = mysqli_fetch_array($result);
		if ($row['cc'] == 1) {
			switch ($actionName) {
				case 'getCities':
					$actionResponse = getCities($actionRequest);
					break;
				case 'addCity':
					$actionResponse = addCity($actionRequest);
					break;	
				case 'editCity':
					$actionResponse = editCity($actionRequest);
					break;	
				case 'deleteCity':
					$actionResponse = deleteCity($actionRequest);
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

function getCities($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['data'] = array();
	$cities = get_sql('SELECT id, name, is_office FROM city ORDER BY id', 1, '', array());
	while ($city = mysqli_fetch_array($cities)) {
		$val = array();
		$val['id'] = $city[0];
		$val['name'] = $city[1];
		$val['is_office'] = $city[2];
		$actionResponse['data'][] = $val;
	}
	mysqli_free_result($cities);
	return $actionResponse;	
}

function getCityInfoText($cityId) {
	$returnValue = null;
	$result = get_sql('SELECT CONCAT(name, " (id=", id, ")") AS name FROM city WHERE id=?', 2, 's', array($cityId));
	if (!$result) {
		$returnValue = null; 		
	} else {
		$row = mysqli_fetch_array($result);
		$returnValue = $row['name'];		
		mysqli_free_result($result);
	}
	return $returnValue;	
}

function checkCityName($cityName, $cityId) {
	$returnValue = '';	
	if (trim($cityName) == '') {
		$returnValue = 'Заполните наименование города.'; 		
	} else {
		$result = get_sql('SELECT id FROM city WHERE TRIM(name)=TRIM(?) AND id<>?', 3, 'ss', array($cityName, $cityId));
		if (!$result) {
			$returnValue = 'Произошла ошибка при проверке дублирования города.'; 		
		} else {
			$row = mysqli_fetch_array($result);
			if ($row['id'] != '') {
				$returnValue = 'Город уже существует (id='.$row['id'].')';
			}
			mysqli_free_result($result);
		}
	}
	return $returnValue;
}

function addCity($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при добавлении города.';
	$cityInfoText = $actionRequest['cityName'];
	
	$res = checkCityName($actionRequest['cityName'], -1);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {
		$new_id_result = get_sql('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM city', 4, '', array());
		if (!$new_id_result) {
			$cityId = null;
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при получении нового id города.';
		} else {
			$row = mysqli_fetch_array($new_id_result);
			$cityId = $row['id']; 	
			mysqli_free_result($new_id_result);
		}		
		if ($cityId != null) {
			$res = exec_sql('INSERT INTO city(id, name, is_office) VALUES(?, TRIM(?), ?)', 5, 'sss', 
			  array($cityId, $actionRequest['cityName'], $actionRequest['isOffice']));			
			if ($res != '') {
				$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при добавлении города.';
				$actionResponse['msgText'] .= '<br> • '.$res;		
			} else {
				$actionResponse['msgStatus'] = 'success';
				$actionResponse['msgText'] = 'Город успешно добавлен.';
			}
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$cityInfoText = 'Добавляемый город:<br>'.$cityInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$cityInfoText;
	return $actionResponse;	
}

function editCity($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при редактировании города.';
	$cityInfoText = getCityInfoText($actionRequest['cityId']);
	
	$res = checkCityName($actionRequest['cityName'], $actionRequest['cityId']);
	if ($res != '') {
		$actionResponse['msgText'] = $res;	
	} else {		
		$res = exec_sql('UPDATE city SET name=TRIM(?), is_office=? WHERE id=?', 6, 'sss', 
		  array($actionRequest['cityName'], $actionRequest['isOffice'], $actionRequest['cityId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при редактировании города.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Город успешно изменен.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$cityInfoText = 'Редактируемый город:<br>'.$cityInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$cityInfoText;
	return $actionResponse;	
}

function deleteCity($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при удалении города.';
	$cityInfoText = getCityInfoText($actionRequest['cityId']);
	
	if ($cityInfoText == null) {
		$actionResponse['msgText'] = 'Город не найден.';	
	} else {
		$res = exec_sql('DELETE FROM city WHERE id=?', 7, 's', array($actionRequest['cityId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при удалении города.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'Город успешно удален.';
		}
	}
	if ($actionResponse['msgStatus'] != 'success') {
		$cityInfoText = 'Удаляемый город:<br>'.$cityInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$cityInfoText;
	return $actionResponse;	
}
	

?>