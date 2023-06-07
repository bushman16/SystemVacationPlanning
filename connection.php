<?php
$conn;
$conn_info;

function db_connect() {
	global $conn;
	global $conn_info;
	
	$host = 'localhost'; 
	$database = 'sc_db';
	$user = 'sc_db_user';
	$password = 'z9ZfCZpwkDnEH9mQ55';
	
	$conn_info = array();
	$conn_info['host'] = $host;
	$conn_info['database'] = $database;
	$conn_info['user'] = $user;
	$conn_info['password'] = $password;

	$conn = mysqli_connect($host, $user, $password, $database);
	mysqli_query($conn, 'SET NAMES "utf8";');
	mysqli_query($conn, 'SET CHARACTER SET "utf8";');
	mysqli_query($conn, 'SET SESSION collation_connection = "cp1251_general_cs";');
	mysqli_query($conn, 'set character_set_results="utf8"');
}

function refValues($arr) {
  if (strnatcmp(phpversion(),'5.3') >= 0) { 
    $refs = array();
    foreach($arr as $key => $value) {
      $refs[$key] = &$arr[$key]; 
    }
    return $refs; 
  }
  return $arr; 
}

function db_stmt_bind_param($stmt, $param_type, $params){
  $opts[] = $stmt;
  $opts[] = $param_type;
  foreach($params as $param){
    $opts[] = $param;
  }
  return call_user_func_array('mysqli_stmt_bind_param', refValues($opts));
}

function format_error_text($error_type, $sql_num, $error_text, $sql_text) {
  $new_sql_text = str_replace('"', '', $sql_text);
  $new_sql_text = str_replace("'", '', $new_sql_text);
  $new_sql_text = str_replace("|", '', $new_sql_text);
  $new_sql_text = str_replace(":", '', $new_sql_text);
  $new_error_text = str_replace('"', '', $error_text);
  $new_error_text = str_replace("'", '', $new_error_text);
  $new_error_text = str_replace("|", '', $new_error_text);
  $new_error_text = str_replace(":", '', $new_error_text);
  $res = $error_type.' '.$sql_num.'|'.$new_error_text.'|'.$new_sql_text;
  return $res;	
}

function exec_sql($sql_text, $sql_num, $param_type, $param_arr) {
  global $conn;
  $sql_error = '';

  if ($sql_stmt = mysqli_prepare($conn, $sql_text)) {
	if ($param_type != '') {   
		db_stmt_bind_param($sql_stmt, $param_type, $param_arr);
	}
    $result = mysqli_stmt_execute($sql_stmt);
    if (!$result) {
      $sql_error = format_error_text('Ошибка execute', $sql_num, mysqli_error($conn), $sql_text);
      mysqli_query($conn, 'ROLLBACK;');
    }
    mysqli_stmt_close($sql_stmt);
  } else {
	  $sql_error = format_error_text('Ошибка prepare', $sql_num, mysqli_error($conn), $sql_text);
  }
  if ($sql_error == '') {
	$res = '';	  
  } else {
	$res = $sql_error;
  }
  return $res;
}

function get_sql($sql_text, $sql_num, $param_type, $param_arr) {
  global $conn;
  $sql_error = '';

  if ($sql_stmt = mysqli_prepare($conn, $sql_text)) {
	if ($param_type != '') { 
		db_stmt_bind_param($sql_stmt, $param_type, $param_arr);
	}
	mysqli_stmt_execute($sql_stmt);
    $result = mysqli_stmt_get_result($sql_stmt);	
    if (!$result) {
	  $sql_error = format_error_text('Ошибка select', $sql_num, mysqli_error($conn), $sql_text);
    }
    mysqli_stmt_close($sql_stmt);
  } else {
	  $sql_error = format_error_text('Ошибка prepare', $sql_num, mysqli_error($conn), $sql_text);
  }
  if ($sql_error == '') {
	$res = $result;	  
  } else {
	$res = $sql_error;
  }
  return $res;
}

function create_dump() {
	global $conn_info;
	
	include_once('mysqldump.php');
	$filename = 'dump_'.$database.'_'.date('Ymd_His').'.gz';
	$dumpSettings = array(
		'compress' => Ifsnop\Mysqldump\Mysqldump::GZIP,
		'add-drop-database' => true,
		'complete-insert' => true
	);
	$connectStr = 'mysql:host='.$conn_info['host'].';dbname='.$conn_info['database'];
	$dump = new Ifsnop\Mysqldump\Mysqldump($connectStr, $conn_info['user'], $conn_info['password'], $dumpSettings);
	$dump->start($filename);
}


?>