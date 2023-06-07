<?php
require_once 'connection.php';
define('FPDF_FONTPATH',"fpdf/font/");
require_once('fpdf/fpdf.php');
//require_once('fpdf/makefont/makefont.php');

spl_autoload_register(function($className) {
    require_once __DIR__ . '/' . str_replace('\\', '/', $className) . '.php';
});

function getPrintApiMethod($actionRequest, $auth) {
	$actionName = isset($actionRequest['actionName']) ? $actionRequest['actionName'] : '';
	switch ($actionName) {
		case 'printVacation':		
			$actionResponse = preparePrint($actionRequest, $auth);
			break;		
		default:
			$actionResponse['msgStatus'] = 'danger';
			$actionResponse['msgText'] = 'Неизвестный метод.';
			break;	
	}
	return $actionResponse;		
}

function preparePrint($actionRequest, $auth) {
	$auth->set_print_action($actionRequest);
	$actionResponse['inputRequest'] = $actionRequest;
	return $actionResponse;
}

function printPdf($auth) {
	// MakeFont('C:\\OpenServer\\domains\\sc.solit-clouds.ru\\fpdf\\font\\times.pfb', 'cp1251');
	header('Content-Type: application/pdf');
	$action = $auth->get_print_action();
	$formCode = isset($action['formCode']) ? $action['formCode'] : '';
	$vacationId = isset($action['vacationId']) ? $action['vacationId'] : -1;
	$printDate = isset($action['printDate']) ? $action['printDate'] : '';
	
	if (($formCode == 'vacRegular') || ($formCode == 'vacWithoutPay')) {
		if ($vacationId != -1) {
			$isRegular = $formCode == 'vacRegular' ? 1 : 0;
			print_vacation_application($vacationId, $printDate, $isRegular);
		}
	}
	$auth->set_print_action('');
}


function rus_text($text) {
	return iconv('utf-8', 'windows-1251', $text);
}

function formatDate($dt) {
	if ($dt == 0) return '';
	$monthsList = array(
	  '.01.' => 'января',
	  '.02.' => 'февраля',
	  '.03.' => 'марта',
	  '.04.' => 'апреля',
	  '.05.' => 'мая',
	  '.06.' => 'июня',
	  '.07.' => 'июля',
	  '.08.' => 'августа',
	  '.09.' => 'сентября',
	  '.10.' => 'октября',
	  '.11.' => 'ноября',
	  '.12.' => 'декабря'
	);
	$m = date('.m.', strtotime($dt));
	$d = date('d', strtotime($dt));
	$y = date('Y', strtotime($dt));
	return '«'.$d.'» '.$monthsList[$m].' '.$y.' г.'; 
}

function formatDaysCount($dayCount) {
	$daysList = array('календарный день', 'календарных дня', 'календарных дней');
	$p = 2;	
    if (($dayCount % 10 == 1) && ($dayCount % 100 != 11)) {
        $p = 0;
    } else if ((2 <= $dayCount % 10) && ($dayCount % 10 <= 4) && (($dayCount % 100 < 10) || ($dayCount % 100 >= 20))) {
        $p = 1;
    }
    return $dayCount.' '.$daysList[$p];
}

function select_cur_date($form_id, $employee_id, $vacation_date) {
	
}

function print_vacation_application($vacationId, $cur_date, $is_regular) {
	$res = true; 
	$vacation_result = get_sql('select employee_id, date_begin, days_count as days_count, 
							date_add(date_begin, interval days_count+holidays_count-1 day) as date_end 
							from vacation where id=?', 1, 'd', array($vacationId));
	if (!$vacation_result) {
		$res = false; 		
	} else {
		$row = mysqli_fetch_array($vacation_result);
		$employee_id = $row['employee_id'];
		$date_begin = $row['date_begin'];
		$date_end = $row['date_end'];
		$days_count = $row['days_count'];
		mysqli_free_result($vacation_result);
	}
	if ($res) {
		$employee_result = get_sql('select u.last_name_for_print, u.last_name, 
					  concat(substring(u.first_name, 1, 1), ".", substring(u.middle_name, 1, 1), ".") as io_name,
					  j.name_for_print as job_name, u.is_male, o.name as org_name, o.text_for_print as gd_name
					  from user as u, employee as e 
					  left outer join job as j on j.id=e.job_id
					  left outer join organization as o on o.id=e.organization_id
					  where u.id=e.user_id and e.id=?', 2, 'd', array($employee_id));
		if (!$employee_result) {
			$res = false; 		
		} else {
			$row = mysqli_fetch_array($employee_result);
			$last_name_for_print = $row['last_name_for_print'];
			$last_name = $row['last_name'];
			$io_name = $row['io_name'];
			$job_name = $row['job_name'];
			$org_name = $row['org_name'];
			$gd_name = $row['gd_name'];
			mysqli_free_result($employee_result);
		}	
	}
	if ($res) {
		$pdf = new FPDF('P','mm','A4');
		$pdf->SetMargins (25, 15, 15);
		$pdf->AddFont('times','','times.php');
		$pdf->SetFont('times', '', 14);
		$pdf->SetTextColor(0, 0, 0);		
		$pdf->AddPage('P');
		$pdf->SetDisplayMode('fullpage', 'default');
		$pdf->SetXY(115, 20);
		$txt = 'Генеральному директору'.PHP_EOL.$org_name.PHP_EOL.$gd_name.PHP_EOL.'от '.$job_name.PHP_EOL;
		$txt .= $io_name.' '.$last_name_for_print;
		$pdf->MultiCell(0, 6, rus_text($txt), 0, 'L');
		$pdf->Ln(25);
		$pdf->MultiCell(0, 6, rus_text('ЗАЯВЛЕНИЕ'), 0, 'C');
		$pdf->Ln(15);
		if ($is_regular) {
			$vacTxt = 'очередной оплачиваемый отпуск';
		} else {
			$vacTxt = 'отпуск без сохранения заработной платы';	
		}
		$txt = '    Прошу предоставить мне '.$vacTxt.' на '.formatDaysCount($days_count);
		$txt .= ' с '.formatDate($date_begin).' по '.formatDate($date_end).' включительно.';
		$pdf->SetX(20);
		$pdf->MultiCell(0, 6, rus_text($txt), 0, 'L');
		$pdf->Ln(20);
		$pdf->SetFontSize(13);
		if ($cur_date == '') {
			$pdf->MultiCell(0, 6, rus_text('«____» ______________ 20___г.'), 0, 'R');	
		} else {
			$pdf->MultiCell(0, 6, rus_text(formatDate(date('Y-m-d', strtotime($cur_date)))), 0, 'R');
		}		
		$pdf->Ln();
		$pdf->MultiCell(0, 6, rus_text('___________________ / '.$last_name.' '.$io_name), 0, 'R');
		$pdf->Ln(20);
		$pdf->SetX(25);
		$txt = '«СОГЛАСОВАНО»'.PHP_EOL.PHP_EOL.'_______________________'.PHP_EOL.PHP_EOL.'«____» ___________20___г.';
		$pdf->MultiCell(0, 6, rus_text($txt), 0, 'L');
		$pdf->Ln(30);
		$pdf->Ln();
		$pdf->Ln();
		$pdf->SetTitle('Заявление на отпуск '.date('d.m.Y', strtotime($date_begin)).'-'.date('d.m.Y', strtotime($date_end)), true);
		$pdf->Output();
	}
}

?>