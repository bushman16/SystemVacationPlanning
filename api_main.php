<?php
session_start();
require_once 'auth.php';
require_once 'global_params.php';


function getMainApiMethod($actionRequest) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	switch ($actionName) {
		case 'checkMsg':
			$actionResponse =  checkMsg();
			break;
		case 'login':
			$actionResponse =  loginUser($actionRequest);
			break;
		case 'logout':
			$actionResponse =  logoutUser($actionRequest);
			break;				
		default:
			$actionResponse['msgStatus'] = 'danger';
			$actionResponse['msgText'] = 'Неизвестный метод.';
			break;	
	}
	return $actionResponse;		
}

function checkMsg() {
	global $auth;
	global $default_page;
	global $all_pages;
	global $right_pages;
	$actionResponse = $auth->get_route_action();
	$refererUrlPath = parse_url($_SERVER['HTTP_REFERER'])['path'];
	$refererUrlPath = isset($refererUrlPath) ? $refererUrlPath : '';
	$refererUrlPathArray = explode('/', $refererUrlPath);
	if (count($refererUrlPathArray) > 0) {
		$refererUrlPath = $refererUrlPathArray[count($refererUrlPathArray)-1];	
	}
	if ((!in_array($refererUrlPath, $all_pages)) or ($auth->session_is_auth() and (in_array($refererUrlPath, $right_pages)) and (!in_array($refererUrlPath, $auth->get_session_user_rights())))) {
		if ($actionResponse == '') {
			$actionResponse = null;
		}
		$actionResponse['route'] = $default_page;
	}
	$auth->set_route_action('');	
	return $actionResponse;	
}

function loginUser($actionRequest) {
	global $auth;
	global $wiki_url;
	$login = isset($actionRequest['username']) ? $actionRequest['username'] : '';
	$password = isset($actionRequest['password']) ? $actionRequest['password'] : '';
	$actionResponse['inputRequest'] = $actionRequest;
	if (!$auth->session_auth($wiki_url, $login, $password)) {
		$actionResponse['msgStatus'] = 'danger';
		$actionResponse['msgText'] = 'Неправильное имя пользователя или пароль.';
	} else {
		$actionResponse['route'] = '';
	}
	$auth->set_route_action('');
	return $actionResponse;	
}

function logoutUser($actionRequest) {
	global $auth;
	$auth->session_out();		
	$actionResponse['inputRequest'] = $actionRequest;
	$actionResponse['route'] = '';	
	$actionRouteResponse['inputRequest'] = $actionRequest;
	$actionRouteResponse['msgStatus'] = 'success';
	$actionRouteResponse['msgText'] = 'Вы успешно вышли из системы.';
	$auth->set_route_action($actionRouteResponse);	
	return $actionResponse;	
}

?>