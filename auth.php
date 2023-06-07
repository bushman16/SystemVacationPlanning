<?php
session_start(); 

require_once 'connection.php';

class AuthClass {
	
	const GUEST_AUTH_RIGHT = false;
	const SESSION_ACTIVITY = 86400;
	
	function __construct() {
		if (!isset($_SESSION['is_auth'])) { 
			$_SESSION['is_auth'] = false;
		}
		if (!isset($_SESSION['route_action'])) { 
			$_SESSION['route_action'] = '';
		}
		if (!isset($_SESSION['print_action'])) { 
			$_SESSION['print_action'] = '';
		}		
	}

	public function session_is_auth() {
		if (isset($_SESSION['is_auth'])) {
			if ($_SESSION['is_auth'] && (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > self::SESSION_ACTIVITY))) {
				$_SESSION['is_auth'] = false;
				$actionRoute['inputRequest'] = $_SESSION['route_action'];
				$actionRoute['msgStatus'] = 'warning';
				$actionRoute['msgText'] = 'Сессия была завершена по таймауту.';
				$_SESSION['route_action'] = $actionRoute;				
			}
			$_SESSION['last_activity'] = time();					
			return $_SESSION['is_auth']; 
		} else {
			return false; 
		}
	}
	
	public function is_test_server() {
		return strtolower($_SERVER['HTTP_HOST']) == 'sc.solit-clouds.ru';	
	}

	private function check_wiki_auth($wiki_url, $login, $password) {
		if ($this->is_test_server()) {
			return true;
		}
		$return_value = false;	
		$check_url = $wiki_url.'users/viewmyprofile.action';
		$options = array(
			CURLOPT_HTTPAUTH 	   => CURLAUTH_BASIC,       
			CURLOPT_USERPWD 	   => $login.':'.$password, 
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_HEADER         => false,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_ENCODING       => '',
			CURLOPT_USERAGENT      => 'Mozilla/5.0',
			CURLOPT_AUTOREFERER    => true,
			CURLOPT_CONNECTTIMEOUT => 120,
			CURLOPT_TIMEOUT        => 120,
			CURLOPT_MAXREDIRS      => 10,
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_CUSTOMREQUEST  => 'GET',
			CURLOPT_URL			   => $check_url
		);
		$ch = curl_init();
		curl_setopt_array($ch, $options);	
		$content = curl_exec($ch);
		$res = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$return_value = $res == 200;
		curl_close($ch);	
		return $return_value;
	}

	public function session_auth($wiki_url, $login, $password) {
		if (self::GUEST_AUTH_RIGHT && ($login == '')) {				
			$_SESSION['is_auth'] = true; 
			$_SESSION['login'] = ''; 
			$_SESSION['name'] = 'Гость';
			$_SESSION['id'] = -1;
			$_SESSION['user_rights'] = array();			
		} else {
			$_SESSION['is_auth'] = false;
			$result = get_sql('select id, login, concat(last_name, " ", first_name, " ", middle_name) as name 
								from user where lower(login)=lower(?)', 1, 's', array($login));
			if (!$result) {
				$return_value = false; 		
			} else {
				$row = mysqli_fetch_array($result);
				if ($row['login'] != '') {		
					if ($this->check_wiki_auth($wiki_url, $login, $password)) {				
						$_SESSION['is_auth'] = true;
						$_SESSION['last_activity'] = time();						
						$_SESSION['login'] = $login; 
						$_SESSION['name'] = $row['name'];
						$_SESSION['id'] = $row['id'];
						$_SESSION['user_rights'] = array();
						$rights = get_sql('select r.code from user_in_right e, user_right r where r.id=e.right_id and e.user_id=?', 2, 'd', array($row['id']));
						while ($right = mysqli_fetch_array($rights)) {
							$_SESSION['user_rights'][] = $right[0];
						}
						mysqli_free_result($rights);						
					}
				}
				mysqli_free_result($result);
			}
		}
		return $_SESSION['is_auth'];
	}
		
	public function get_session_user_login() {
		if ($this->session_is_auth()) { 
			return $_SESSION['login']; 
		} else {
			return '';	
		}
	}

	public function get_session_user_name() {
		if ($this->session_is_auth()) { 
			return $_SESSION['name']; 
		} else {
			return '';	
		}
	} 

	public function get_session_user_id() {
		if ($this->session_is_auth()) { 
			return $_SESSION['id']; 
		} else {
			return -1000;	
		}
	}
	
	public function get_session_user_rights() {
		if ($this->session_is_auth()) { 
			return $_SESSION['user_rights']; 
		} else {
			return array();	
		}
	}

	public function get_route_action() {
		return $_SESSION['route_action']; 
	}

	public function set_route_action($route_action) {
		$_SESSION['route_action'] = $route_action;	
	}

	public function get_print_action() {
		return $_SESSION['print_action']; 
	}

	public function set_print_action($print_action) {
		$_SESSION['print_action'] = $print_action;	
	}
		
	public function session_out() {
		$_SESSION = array();
		session_destroy(); 
		session_start();
		$_SESSION['is_auth'] = false;
		$_SESSION['route_action'] = '';
		$_SESSION['print_action'] = '';
	}

}

$auth = new AuthClass();

?>