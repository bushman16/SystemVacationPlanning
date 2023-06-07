<?php

if (file_exists('htm//reconstruction.htm')) {
	include 'htm//reconstruction.htm';	
	exit;
}

session_start();
require_once 'global_params.php';
require_once 'connection.php';
require_once 'auth.php';
require_once 'api_main.php';
require_once 'api_calendar.php';
require_once 'api_employee.php';
require_once 'api_print.php';
//require_once 'api_internal.php';
require_once 'api_admin.php';
require_once 'api_admin_city.php';
require_once 'api_admin_organization.php';	
require_once 'api_admin_job.php';
require_once 'api_admin_role.php';
require_once 'api_admin_calendar.php';
require_once 'api_admin_user.php';

db_connect();

$page = isset($_REQUEST['page']) ? $_REQUEST['page'] : '';

$actionRequest = json_decode(file_get_contents('php://input'), true);

$versionText = str_replace(' ', '_', $app_version);
if ($auth->is_test_server()) {
	$versionText .= '_'.date('YmdHis');
}

if ($page == 'print') {
	printPdf($auth);
	exit;
}

header('Content-Type: text/html; charset=utf-8');

if ($page == 'api') {
	$actionResponse = null;
	$actionType = isset($actionRequest['actionType']) ? $actionRequest['actionType'] : '';
	switch ($actionType) {
		case 'main':
			$actionResponse = getMainApiMethod($actionRequest);
			break;			
		case 'calendar':
			if ($auth->session_is_auth()) {
				$actionResponse = getCalendarApiMethod($actionRequest, $auth->get_session_user_id(), $auth);
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;	
		case 'employee':
			if ($auth->session_is_auth()) {
				$actionResponse = getEmployeeApiMethod($actionRequest, $auth->get_session_user_id());
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;	
		case 'print':
			$actionResponse = getPrintApiMethod($actionRequest, $auth);
			break;	
		case 'internal':
			if ($auth->session_is_auth()) {
				$actionResponse = getInternalApiMethod($actionRequest, $auth);
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;
		case 'admin.city':
			if ($auth->session_is_auth()) {
				$actionResponse = getAdminCityApiMethod($actionRequest, $auth->get_session_user_id());
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;		
		case 'admin':
			if ($auth->session_is_auth()) {
				$actionResponse = getAdminApiMethod($actionRequest, $auth->get_session_user_id());
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;
		case 'admin.organization':
			if ($auth->session_is_auth()) {
				$actionResponse = getAdminOrganizationApiMethod($actionRequest, $auth->get_session_user_id());
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;
		case 'admin.job':
			if ($auth->session_is_auth()) {
				$actionResponse = getAdminJobApiMethod($actionRequest, $auth->get_session_user_id());
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;	
		case 'admin.role':
			if ($auth->session_is_auth()) {
				$actionResponse = getAdminRoleApiMethod($actionRequest, $auth->get_session_user_id());
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;	
		case 'admin.calendar':
			if ($auth->session_is_auth()) {
				$actionResponse = getAdminCalendarApiMethod($actionRequest, $auth->get_session_user_id());
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;
		case 'admin.user':
			if ($auth->session_is_auth()) {
				$actionResponse = getAdminUserApiMethod($actionRequest, $auth->get_session_user_id());
			} else {
				$actionResponse['msgStatus'] = 'danger';
				$actionResponse['msgText'] = 'Пользователь не определен.';				
			}
			break;
		default:
			$actionResponse['msgStatus'] = 'danger';
			$actionResponse['msgText'] = 'Неизвестный тип метода.';
			break;	
	}
	print(json_encode($actionResponse));
	exit;
}	

$session_is_auth = $auth->session_is_auth();
if (!$session_is_auth) {	
	$template_name = 'auth';
} else {
	if (in_array($page, $all_pages)) {
		if (((in_array($page, $right_pages)) and (!in_array($page, $auth->get_session_user_rights()))) or 
		    ((in_array($page, $admin_pages)) and (!in_array('admin', $auth->get_session_user_rights()))) or 
			((in_array($page, $internal_pages)) and (!in_array('internalAdmin', $auth->get_session_user_rights())))) {
			$template_name = $default_page;
			$page = $default_page;			
		} else {
			$template_name = $page;			
		}		
	} else {
		$template_name = $default_page;
		$page = $default_page;	
	}
	$login = $auth->get_session_user_login();
	$user_name = $auth->get_session_user_name();
	$user_id = $auth->get_session_user_id();
}
	
include 'htm//header.htm';
include 'htm//'.$template_name.'.htm';
include 'htm//footer.htm';

//db_disconnect();

?>