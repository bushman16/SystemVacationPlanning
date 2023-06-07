<?php
session_start();
require_once 'auth.php';
require_once 'global_params.php';
require_once 'connection.php';


function getAdminCalendarApiMethod($actionRequest, $userId) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	$result = get_sql('SELECT count(*) cc FROM user_in_right WHERE right_id=100 AND user_id=?', 0, 'd', array($userId));
	if (!$result) {
		$actionResponse['msgStatus'] = 'danger';
		$actionResponse['msgText'] = 'Произошла ошибка.';
	} else {
		$row = mysqli_fetch_array($result);
		if ($row['cc'] == 1) {
			switch ($actionName) {
				case 'getCalendars':
					$actionResponse = getCalendars($actionRequest);
					break;
				case 'getLastYear':
					$actionResponse = getLastYear($actionRequest);
					break;
				case 'getDays':
					$actionResponse = getDays($actionRequest);
					break;
				case 'getFilters':
					$actionResponse = getFilters($actionRequest);
					break;
				case 'addCalendar':
					$actionResponse = addCalendar($actionRequest);
					break;	
				case 'editCalendar':
					$actionResponse = editCalendar($actionRequest);
					break;	
				case 'deleteCalendar':
					$actionResponse = deleteCalendar($actionRequest);
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

function getCalendars($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['data'] = array();
	$calendars = get_sql('SELECT date_fix, day_type_id, date_text FROM work_calendar WHERE YEAR(date_fix) = (TRIM(?))', 1, 's', array($actionRequest['FilterYear']));
	while ($calendar = mysqli_fetch_array($calendars)) {
		$val = array();
		$val['date_fix'] = $calendar[0];
		$val['day_type_id'] = $calendar[1];
		$val['date_text'] = $calendar[2];
		$actionResponse['data'][] = $val;
	}
	mysqli_free_result($calendars);
	return $actionResponse;	
}

function getDays($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['day'] = array();
	$days = get_sql('SELECT id, name FROM day_type', 1, '', array());
	while ($day = mysqli_fetch_array($days)) {
		$val = array();
		$val['id'] = $day[0];
		$val['name'] = $day[1];
		$actionResponse['day'][] = $val;
	}
	mysqli_free_result($days);
	return $actionResponse;	
}

function getFilters($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['filter'] = array();
	$filters = get_sql('SELECT DISTINCT YEAR(date_fix) FROM work_calendar ORDER BY YEAR(date_fix) DESC', 1, '', array());
	while ($filter = mysqli_fetch_array($filters)) {
		$val = array();
		$val['year'] = $filter[0];
		$actionResponse['filter'][] = $val;
	}
	mysqli_free_result($filters);
	return $actionResponse;	
}

function getLastYear($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['last_year'] = array();
	$last_years = get_sql('SELECT YEAR(MAX(date_fix)) FROM work_calendar', 1, '', array());
	while ($last_year = mysqli_fetch_array($last_years)) {
		$val = array();
		$val['year'] = $last_year[0];
		$actionResponse['last_year'][] = $val;
	}
	mysqli_free_result($last_years);
	return $actionResponse;	
}




function getCalendarInfoText($calendarId) {
	$returnValue = null;
	$result = get_sql('SELECT CONCAT(date_text, " (date_fix=", date_fix, ")") AS date_text FROM work_calendar WHERE date_fix=?', 2, 's', array($calendarId));
	if (!$result) {
		$returnValue = null; 		
	} else {
		$row = mysqli_fetch_array($result);
		$returnValue = $row['date_text'];		
		mysqli_free_result($result);
	}
	return $returnValue;	
}



function addCalendar($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при добавлении дня.';
	$calendarInfoText = $actionRequest['calendarDateText'];
	$res = exec_sql('INSERT INTO work_calendar (date_fix, day_type_id, date_text) VALUES(TRIM(?), TRIM(?), TRIM(?))', 5, 'sss', 
	array($actionRequest['calendarDateFix'], $actionRequest['isDay'], $actionRequest['calendarDateText']));			
	if ($res != '') {
		$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при добавлении дня.';
		$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'День успешно добавлен.';
		}
	if ($actionResponse['msgStatus'] != 'success') {
		$calendarInfoText = 'Добавляемый день:<br>'.$calendarInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$calendarInfoText;
	return $actionResponse;	
}

function editCalendar($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при редактировании дня.';
	$calendarInfoText = getCalendarInfoText($actionRequest['calendarId']);		
	$res = exec_sql('UPDATE work_calendar SET day_type_id=TRIM(?), date_text=TRIM(?)  WHERE date_fix=TRIM(?)', 6, 'sss', 
	array($actionRequest['isDay'], $actionRequest['calendarDateText'], $actionRequest['calendarDateFix']));			
	if ($res != '') {
		$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при редактировании дня.';
		$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'День успешно изменен.';
		}
	if ($actionResponse['msgStatus'] != 'success') {
		$calendarInfoText = 'Редактируемый день:<br>'.$calendarInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$calendarInfoText;
	return $actionResponse;	
}

function deleteCalendar($actionRequest) {
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['msgStatus'] = 'danger';
	$actionResponse['msgText'] = 'Произошла неизвестная ошибка при удалении дня.';
	$calendarInfoText = getCalendarInfoText($actionRequest['calendarId']);
	$res = exec_sql('DELETE FROM work_calendar WHERE date_fix=?', 7, 's', array($actionRequest['calendarId']));			
		if ($res != '') {
			$actionResponse['msgText'] = 'Произошла непредвиденная ошибка при удалении дня.';
			$actionResponse['msgText'] .= '<br> • '.$res;		
		} else {
			$actionResponse['msgStatus'] = 'success';
			$actionResponse['msgText'] = 'День успешно удален.';
		}
	
	if ($actionResponse['msgStatus'] != 'success') {
		$calendarInfoText = 'Удаляемый день:<br>'.$calendarInfoText;
	}
	$actionResponse['msgText'] .= '<br><br>'.$calendarInfoText;
	return $actionResponse;	
}
?>