const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const calendarInfoText = '<div class="card" style="width: 20rem;"><h6 class="card-header">Условные обозначения</h6><div class="card-body">' +
						'<div class="row row-2 mb-2"><div class="col col-md-auto"><table class="calendarTable"><tr><td class="calendarEmpty calendarToday"></td></tr></table></div>' +
						'<div class="col">Сегодня</div></div>' +
						'<div class="row mb-2"><div class="col col-md-auto"><table class="calendarTable"><tr><td class="calendarVacGood"></td></tr></table></div>' +
						'<div class="col">Согласованный отпуск</div></div>' +	
						'<div class="row mb-2"><div class="col col-md-auto"><table class="calendarTable"><tr><td class="calendarVac"></td></tr></table></div>' +
						'<div class="col">Запланированный отпуск</div></div>' +
						'<div class="row mb-2"><div class="col col-md-auto"><table class="calendarTable"><tr><td class="calendarVac calendarVacPastYear"></td></tr></table></div>' +
						'<div class="col">Перенос отпуска с другого года</div></div>' +
						'<div class="row mb-2"><div class="col col-md-auto"><table class="calendarTable"><tr><td class="calendarVac calendarVacWithoutPay"></td></tr></table></div>' +
						'<div class="col">Отпуск за свой счет</div></div>' +
						'<div class="row mb-2"><div class="col col-md-auto"><table class="calendarTable"><tr><td class="calendarVacSick"></td></tr></table></div>' +
						'<div class="col">Больничный</div></div>' +
						'</div></div>';

const vacationDaysInYear = 28;
const vacationDaysInOne = 14;

var calendarFilterText = "";
var calendarFilter = null;
var yearValue = "";
var curDate = 0;
var userId = -1;
var userChiefId = -1;
var userRights = [];
var scrollPos = -1;
var calendarScrollX = -1;
var calendarScrollAll = 0;
var calendarTabIdx = -1;
var calendarHintsText = "";
var navbarHeight = document.getElementById("navbar").offsetHeight;
var mainJson = {};

var vacationTypes = {};
var employeesArray = [];
var workCalendarArray = [];
var workCalendarIsLoad = false;

function loadWorkCalendar() {
	sendRequest({"actionType": "calendar", "actionName": "getWorkCalendar", "year": yearValue})
	.then(function(jsonResponse) {
		workCalendarArray = jsonResponse["dates"];
		workCalendarIsLoad = true;
		refreshTab();
	});
}

function refreshAll() {
	showScreenLoader();
	if ((document.getElementById("calendarBoxMain") != null) && (document.getElementById("calendarBoxMain").innerHTML != "")) {
		scrollPos = document.getElementById("calendarBoxMain").scrollLeft;
	} 
	if ((calendarFilter != null) && (yearValue != calendarFilter['year']['value'])) {
		scrollPos = -1;	
	}
	sendRequest({"actionType": "calendar", "actionName": "getVacations", "filter": calendarFilter})
	.then(function(jsonResponse) {
		calendarFilter = jsonResponse['filter'];
		calendarFilterText = '<div class="card" style="width: 27rem;"><h6 class="card-header">Применён фильтр</h6><div class="card-body">';
		for (var code in calendarFilter) {
			calendarFilterText += '<div class="row mb-3 d-flex flex-start"><div class="col col-5 calendarGrey">' + calendarFilter[code]['name'];
			calendarFilterText += '</div><div class="col">' + calendarFilter[code]['text'] + '</div></div>';
		}
		calendarFilterText += '</div></div>';
		yearValue = calendarFilter['year']['value'];
	
		mainJson = jsonResponse;

		userId = mainJson.user_id;
		userChiefId = mainJson.user_chief_id;
		userRights = mainJson.user_rights;
		
		vacationTypes = mainJson.vacation_types;
		curDate = new Date();
		curDate = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate());
		
		employeesArray = [];
		for (var r = 0; r < mainJson.employees.length; r++) {
			employeesArray.push({"id": mainJson.employees[r].id, "user_id": mainJson.employees[r].user_id, "name": mainJson.employees[r].name, 
								 "short_name": mainJson.employees[r].short_name, "chief_id": mainJson.employees[r].chief_id, 
								 "date_create": mainJson.employees[r].date_create, "date_close": mainJson.employees[r].date_close,
								 "unused_vacation_days": mainJson.employees[r].unused_vacation_days, "vacations": []});
			employee = employeesArray[employeesArray.length-1];
			vacationsArray = mainJson.employees[r].vacations;
			if (typeof vacationsArray != "undefined") {
				if (vacationsArray.length > 1) {
					vacationsArray.sort(function(obj1, obj2) {
						if (obj1.date_begin < obj2.date_begin) return -1;
						if (obj1.date_begin > obj2.date_begin) return 1;
						return 0;
					});
				}
				for (var d = 0; d < vacationsArray.length; d++) {
					var dtBegin = new Date(vacationsArray[d].date_begin);
					dtBegin = new Date(dtBegin.getFullYear(), dtBegin.getMonth(), dtBegin.getDate());					   
					var dtEnd = new Date(dtBegin);
					dtEnd.setDate(dtEnd.getDate() + vacationsArray[d].days + vacationsArray[d].holidays - 1);
					employee.vacations.push({"id": vacationsArray[d].id, "date_begin": dtBegin, "date_end": dtEnd, "days": vacationsArray[d].days,
											 "holidays": vacationsArray[d].holidays, "is_approved": vacationsArray[d].is_approved,
											 "type_id": vacationsArray[d].type_id, "check_type": "", "check_text": ""});						
				}
			}	
		}
		if (workCalendarIsLoad) {			
			refreshTab();
		} else {
			loadWorkCalendar();
		}
	});	
}

function refreshTab() {
	checkTextArray = checkVacationsInYear();
	var warningCount = 0;
	var dangerCount = 0;
	for (var i = 0; i < checkTextArray.length; i++) {
		switch (checkTextArray[i]["type"]) {
			case "warning": 
				warningCount += checkTextArray[i]["msg"].length;
				break;
			case "danger": 
				dangerCount += checkTextArray[i]["msg"].length;
				break;
		}		
	}
	if (calendarTabIdx < 0) {
		if (warningCount + dangerCount > 0) {
			calendarTabIdx = 2;	
		} else {
			calendarTabIdx = 0;		
		}		
	}

	var tabNames = ["Календарь", "Список", "Контроль"];
	if ((userRights.indexOf("chief") > -1) || (userRights.indexOf("assistantChief") > -1)) {
		tabNames.push("Отчеты");
	}
	
	divStr = "<div id='popupBox' class='hidden'></div><div class='row row-2 gx-0'><div class='col col-md-auto mx-1 py-1'>";	
	divStr += "<button type='button' id='filterBtn' class='btn sc-btn' onclick='event.stopPropagation();viewMfCalendarFilter();' ";
	divStr += "onmouseenter='event.stopPropagation();viewFilterInfo();' onmouseleave='event.stopPropagation();hidePopupBox();' >";
	divStr += "<span class='fa fa-filter'></span>" + yearValue + " г.</button></div>";
	
	divStr += "<div class='col d-flex align-items-end'><div class='nav nav-pills'>";
	for (var i = 0; i < tabNames.length; i++) {
		divStr += "<a class='nav-link";
		if (i == calendarTabIdx) {
			divStr += " active";
		} else {
			divStr += "' href='' onclick='changeTab(" + i + ");return false;";
		}
		divStr += "'>" + tabNames[i];
		if (i == 2) {
			if (dangerCount > 0) {
				divStr += "<span class='badge rounded-pill sc-bg-danger'> " + dangerCount + " </span>";
			}
			if (warningCount > 0) {
				divStr += "<span class='badge rounded-pill sc-bg-warning'> " + warningCount + " </span>";
			}		
		}
		divStr += "</a>";
	}
	divStr += "</div></div></div><div id='calendarBoxOuter' class='calendarBoxOuter";
	if (calendarTabIdx == 0) {
		divStr += " unselectable";	
	}
	divStr += "'></div>";	
	document.getElementById("mainBodyBox").innerHTML = divStr;

	switch (calendarTabIdx) {
		case 0: 
			refreshCalendar();
			break;
		case 1: 
			refreshTable();
			break;
		case 3: 
			refreshReports();
			break;
		default:
			refreshHints(checkTextArray);	
	}
	
	refreshTooltips("calendarBoxOuter");
	hideScreenLoader();
}

function changeTab(tabIdx) {
  calendarTabIdx = tabIdx;
  refreshTab();
}


function getTableBtnStr(btnTitle, btnImg, btnOnClick) {
	var tableBtnStr = "<button type='button' class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
	tableBtnStr += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='" + btnTitle + "' ";
	tableBtnStr += "onclick='" + btnOnClick + ";return false;'><span class='fa " + btnImg + "'></span></button>";
	return tableBtnStr;
}

function getTableVacationStr(employeeIdx, vacationIdx) {
	var tableVacationStr = "<td class='sc-btn-td sc-line'>";
	if ((vacationTypes[employeesArray[employeeIdx].vacations[vacationIdx].type_id].without_approval != 1) && (employeesArray[employeeIdx].chief_id == userId)) {
		var btnTitle = "Согласовать отпуск";
		var btnImg = "fa-check-circle-o";
		var btnOnClickParam = "1";
		if (employeesArray[employeeIdx].vacations[vacationIdx].is_approved == 1) {
			btnTitle = "Отменить согласование отпуска";
			btnImg = "fa-ban";
			btnOnClickParam = "0";
		} 
		tableVacationStr += getTableBtnStr(btnTitle, btnImg, "changeVacationApprove(" + btnOnClickParam + "," + employeeIdx + "," + vacationIdx + ")");
	}			
	tableVacationStr += "</td>";
	
	var className = "sc-circle-badge";
	if (vacationTypes[employeesArray[employeeIdx].vacations[vacationIdx].type_id].without_approval == 0) {
		if (employeesArray[employeeIdx].vacations[vacationIdx].is_approved == 0) {
			className += " calendarVac";				
		} else {
			className += " calendarVacGood";
		}
	}
	if (employeesArray[employeeIdx].vacations[vacationIdx].type_id == 2) {
		className += " calendarVacPastYear";					
	} else if (employeesArray[employeeIdx].vacations[vacationIdx].type_id == 3) {
		className += " calendarVacSick";					
	} else if (employeesArray[employeeIdx].vacations[vacationIdx].type_id == 5) {
		className += " calendarVacWithoutPay";	
	}
	var tooltipStr = "";
	if (employeesArray[employeeIdx].vacations[vacationIdx].check_type != "") {
		if (employeesArray[employeeIdx].vacations[vacationIdx].check_type == "danger") {
			className += " calendarVacAlarm";				
		} else if (employeesArray[employeeIdx].vacations[vacationIdx].check_type == "warning") {
			className += " calendarVacWarning";
		}
		tooltipStr = " data-bs-toggle='tooltip' data-bs-placement='top' title='" + employeesArray[employeeIdx].vacations[vacationIdx].check_text + "'";	
	}				
	var vacClassName = "";
	var vacBadgeClassName = "";
	if (employeesArray[employeeIdx].vacations[vacationIdx].date_begin <= curDate) {
		vacClassName = " calendarGrey";
		if (employeesArray[employeeIdx].vacations[vacationIdx].check_type == "") {
			vacBadgeClassName = " calendarGrey";
		}
	}
		
	tableVacationStr += "<td class='sc-btn-td sc-line" + vacBadgeClassName + "'><span class='" + className + "'" + tooltipStr + "></span></td>";
	tableVacationStr += "<td class='sc-btn-td sc-line" + vacClassName + "'>с " + formatDate(employeesArray[employeeIdx].vacations[vacationIdx].date_begin);	
	tableVacationStr += " по " + formatDate(employeesArray[employeeIdx].vacations[vacationIdx].date_end) + " (";  
	tableVacationStr += formatCalendarDaysCount(employeesArray[employeeIdx].vacations[vacationIdx].days) + ")</td>";
	tableVacationStr += "<td class='sc-btn-td sc-line'>";
	tableVacationStr += getTableBtnStr("Просмотреть карточку отпуска", "fa-calendar", "viewMfVacationInfo(" + employeeIdx + "," + vacationIdx + ")") + "</td>";	
	if (userId == employeesArray[employeeIdx].user_id) {
		tableVacationStr += "<td class='sc-btn-td sc-line'>";
		if (vacationTypes[employeesArray[employeeIdx].vacations[vacationIdx].type_id].print_form != "") {
			tableVacationStr += getTableBtnStr("Распечатать заявление", "fa-print", "viewMfPrintVacation(" + employeeIdx + "," + vacationIdx + ")");
		}
		tableVacationStr += "</td>";				
		if ((employeesArray[employeeIdx].vacations[vacationIdx].is_approved != 1) || (vacationTypes[employeesArray[employeeIdx].vacations[vacationIdx].type_id].without_approval == 1)) {
			tableVacationStr += "<td class='sc-btn-td sc-line'>";
			tableVacationStr += getTableBtnStr("Редактировать отпуск", "fa-pencil", "showEditVacation(" + employeeIdx + "," + vacationIdx + ")") + "</td>";
			tableVacationStr += "<td class='sc-btn-td sc-line'>";
			tableVacationStr += getTableBtnStr("Удалить отпуск", "fa-trash", "showDeleteVacation(" + employeeIdx + "," + vacationIdx + ")") + "</td>";
		} else {
			tableVacationStr += "<td class='sc-line'></td><td class='sc-line'></td>";	
		}	
	} else {
		tableVacationStr += "<td class='sc-line'></td><td class='sc-line'></td><td class='sc-line'></td>";	
	}			
	return tableVacationStr;
}	

function refreshTable() {
	if (employeesArray.length == 0) {
		var divStr = "<div class='p-3'><div class='alert alert-info'>Данные отсутствуют. Попробуйте ";
		divStr += "<u><span onclick='event.stopPropagation();viewMfCalendarFilter();return false;'>изменить фильтрацию</span></u>.</div></div>";	
		document.getElementById("calendarBoxOuter").innerHTML = divStr;
		return false;	
	}

	divStr = "<div class='d-flex justify-content-center'><table class='sc-table'>";
	for (var r = 0; r < employeesArray.length; r++) {
		divStr += "<tr><td colspan='9'></td></tr><tr><td class='sc-btn-td sc-bottom-line'>";
		divStr += getTableBtnStr("Просмотреть карточку сотрудника", "fa-id-card-o", "viewMfUserInfo(" + employeesArray[r].user_id + ")");
		divStr += "</td><td class='sc-header sc-bottom-line' colspan='6'>" + employeesArray[r].name + "</td>";
		divStr += "<td class='sc-btn-td sc-bottom-line'>";
		if (userId == employeesArray[r].user_id) {
			divStr += getTableBtnStr("Добавить отпуск", "fa-plus", "showEditVacation(" + r + ',-1,"' + formatDate(curDate, true) + '"' +")");
		}
		divStr += "</td><td class='sc-bottom-line'></td></tr>";
		for (var d = 0; d < employeesArray[r].vacations.length; d++) {
			divStr += "<tr><td></td><td></td>" + getTableVacationStr(r, d) + "</tr>";	
		}
	}
	divStr += "</table></div><br/><br/><br/>";
	
	document.getElementById("calendarBoxOuter").innerHTML = divStr;
}

function refreshHints(checkTextArray) {
	divStr = "<div class='p-3'><div class='alert alert-info alert-dismissible'><b>Внимание!</b><br>";
	divStr += "Контроль осуществляется только по отображаемым в календаре данным.<br>Если необходимо, ";
	divStr += "<u><span onclick='event.stopPropagation();viewMfCalendarFilter();return false;'>измените фильтрацию</span></u>.";
	divStr += "<button type='button' class='btn-close' data-bs-dismiss='alert' aria-label='Закрыть'></button></div>";
	
	for (var i = 0; i < checkTextArray.length; i++) {
		divStr += "<div class='alert alert-" + checkTextArray[i]["type"];
		if (checkTextArray[i]["type"] == "info") {
			divStr += " alert-dismissible";
		}
		divStr += "'>" + checkTextArray[i]["name"] + ":<table class='sc-table'>";
		for (var j = 0; j < checkTextArray[i]["msg"].length; j++) {
			divStr += checkTextArray[i]["msg"][j];
		}
		divStr += "</table>";
		if (checkTextArray[i]["type"] == "info") {
			divStr += "<button type='button' class='btn-close' data-bs-dismiss='alert' aria-label='Закрыть'></button>";
		}
		divStr += "</div>";	
	}
	divStr += "</div>";	
	document.getElementById("calendarBoxOuter").innerHTML = divStr;
}

function refreshReports() {
	var divStr = "<div class='p-3'><div class='alert alert-info'><table class='sc-table'>";
	divStr += "<tr><td><div class='sc-header'>Планируемые отпуска на " + yearValue + " год</div>";
	divStr += "<div class='sc-small-font pt-1'>Переносы отпуска с другого года не учитываются.</div></td><td class='sc-btn-td'>"
	divStr += getTableBtnStr("Сформировать отчет", "fa-print", "createPlannedVacationsFile()");
	divStr += "</td></tr></table>";
	divStr += "<br>Если необходим другой год, <u><span onclick='event.stopPropagation();viewMfCalendarFilter();return false;'>";
	divStr += "измените фильтрацию</span></u>.</div></div>";
	document.getElementById("calendarBoxOuter").innerHTML = divStr;
}

function createPlannedVacationsFile() {
	showScreenLoader();
	sendRequest({"actionType": "calendar", "actionName": "getPlannedVacations", "year": yearValue})
	.then(function(jsonResponse) {
		let csvContent = "ЮЛ;Сотрудник;Вид отпуска;Дата начала;Дата окончания;Количество дней\r\n";		
		for (let i = 0; i < jsonResponse.vacations.length; i++) {
			csvContent += jsonResponse.vacations[i].organization + ";";
			csvContent += jsonResponse.vacations[i].name + ";основной;";
			csvContent += jsonResponse.vacations[i].date_begin + ";";
			csvContent += jsonResponse.vacations[i].date_end + ";";
			csvContent += jsonResponse.vacations[i].days_count + ";";
			if (jsonResponse.vacations[i].holidays_count > 0) {
				csvContent += "+" + formatHolidaysCount(jsonResponse.vacations[i].holidays_count);			
			}
			csvContent += "\r\n";
		}
		let encodedUri = "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURI(csvContent);
		let linkElement = document.createElement("a");
		linkElement.setAttribute("href", encodedUri);
		linkElement.setAttribute("download", "planned_vacations_" + yearValue + ".csv");
		document.body.appendChild(linkElement); 
		hideScreenLoader();
		linkElement.click(); 
		document.body.removeChild(linkElement);
	});
}

function viewVacationMenu(employeeIdx, clickDate, x, y) {
	var menuDivStr = "";
	var vacationIdx = -1;
	var employee = employeesArray[employeeIdx];
	for (var vIdx = 0; vIdx < employee.vacations.length; vIdx++) {
		if ((employee.vacations[vIdx].date_begin <= clickDate) && (employee.vacations[vIdx].date_end >= clickDate)) {
			vacationIdx = vIdx;
		}
	}
	if ((vacationIdx != -1) && (vacationTypes[employee.vacations[vacationIdx].type_id].without_approval != 1) && (employee.chief_id == userId)) {
		if (employee.vacations[vacationIdx].is_approved == 1) {
			menuDivStr += getMenuBtnStr("changeVacationApprove(0," + employeeIdx + "," + vacationIdx + ")", "fa-ban", "Отменить согласование отпуска");
		} else {
			menuDivStr += getMenuBtnStr("changeVacationApprove(1," + employeeIdx + "," + vacationIdx + ")", "fa-check-circle-o", "Согласовать отпуск");
		}
	}	
	if (employeesArray[employeeIdx].user_id == userId) {
		if (vacationIdx == -1) {
			menuDivStr += getMenuBtnStr("showEditVacation(" + employeeIdx + ",-1,'" + formatDate(clickDate, true) + "')", "fa-plus", "Добавить отпуск");
		} else {
			if (vacationTypes[employee.vacations[vacationIdx].type_id].print_form != "") {
				menuDivStr += getMenuBtnStr("viewMfPrintVacation(" + employeeIdx + "," + vacationIdx + ")", "fa-print", "Распечатать заявление");
			}		
			if ((employee.vacations[vacationIdx].is_approved != 1) || (vacationTypes[employee.vacations[vacationIdx].type_id].without_approval == 1)) {
				menuDivStr += getMenuBtnStr("showEditVacation(" + employeeIdx + "," + vacationIdx + ")", "fa-pencil", "Редактировать отпуск");
				menuDivStr += getMenuBtnStr("showDeleteVacation(" + employeeIdx + "," + vacationIdx + ")", "fa-trash", "Удалить отпуск");
			}		
		}
	}
	var menuHeaderStr = '<h6>' + employee.short_name + "</h6>";
	if (vacationIdx != -1) {
		menuDivStr += getMenuBtnStr("viewMfVacationInfo(" + employeeIdx + "," + vacationIdx + ")", "fa-calendar", "Просмотреть карточку отпуска");		
		menuHeaderStr += '<div class="calendarGrey">' + vacationTypes[employee.vacations[vacationIdx].type_id].name;
		menuHeaderStr += '<br>с ' + formatDate(employee.vacations[vacationIdx].date_begin, false, true);
		menuHeaderStr += ' по ' + formatDate(employee.vacations[vacationIdx].date_end, false, true) + '<br><span class="sc-small-font">(';  
		menuHeaderStr += formatCalendarDaysCount(employee.vacations[vacationIdx].days);
		if (employee.vacations[vacationIdx].holidays > 0) {
			menuHeaderStr += " +" + formatHolidaysCount(employee.vacations[vacationIdx].holidays);
		}
		menuHeaderStr += ')</span></div>';		
	}
	menuDivStr += getMenuBtnStr("viewMfUserInfo(" + employee.user_id + ")", "fa-id-card-o", "Просмотреть карточку сотрудника");	
	if (menuDivStr != '') {
		menuHeaderStr = '<div class="card" style="width: 20rem;"><div class="card-header">' + menuHeaderStr;
		menuDivStr = menuHeaderStr + '</div><div class="card-body no-padding"><div class="list-group list-group-flush">' + menuDivStr;
		menuDivStr += '</div></div></div>';	
		viewPopupBox(menuDivStr, x - document.getElementById("calendarBoxMain").scrollLeft + document.getElementById("calendarBoxMain").offsetLeft, y, 
						document.getElementById("calendarBoxMain").offsetWidth + document.getElementById("calendarBoxMain").offsetLeft * 2);		
	}
}

function clickCalendar() {
	if (calendarScrollAll > 7) {
		calendarScrollAll = 0;
		return false;
	}

	hidePopupBox();
	var cell = event.target;
	var tagName = cell.tagName;
	if (tagName.toLowerCase() == "td") {
		var i = cell.parentNode.rowIndex - 3;
		var j = cell.cellIndex;
		if (i >= 0) {
			var clickDate = new Date(yearValue, 0, 1);
			clickDate.setDate(clickDate.getDate() + j - 1);					
			viewVacationMenu(i, clickDate, cell.offsetLeft, document.getElementById("calendarBoxOuter").offsetTop + cell.offsetTop + cell.offsetHeight);
		}
	}
}

function getCalendarStr(employeeIdx, vacationIdx) {		
	var	calendarArray = [[]];
	for (var i = 0; i < employeesArray.length; i++) {
		calendarArray[i+1] = [];
	}
	
	var	daysInMonths = [];
	if (typeof vacationIdx == "undefined") {	
		var minDateBegin = new Date(yearValue, 0, 1);		
		var maxDateEnd = new Date(yearValue, 11, 31);
		var employeeIdxsArray = [];
		var employeeWorkDaysArray = [];
		for (var r = 0; r < employeesArray.length; r++) {
			employeeIdxsArray.push(r);	
		}
		var vacBlockStr = "";
		for (var i = 0; i < 12; i++) {
			daysInMonths.push(33 - new Date(yearValue, i, 33).getDate());	
		}
	} else {
		var minDateBegin = new Date(employeesArray[employeeIdx].vacations[vacationIdx].date_begin);		
		var maxDateEnd = new Date(employeesArray[employeeIdx].vacations[vacationIdx].date_end);
		var employeeIdxsArray = [employeeIdx];
		var employeeWorkDaysArray = [{"workDaysCount": 0, "isFirst": true}];
		for (var r = 0; r < employeesArray.length; r++) {
			if (r != employeeIdx) {
				for (var d = 0; d < employeesArray[r].vacations.length; d++) {
					if ((employeesArray[r].vacations[d].date_begin <= employeesArray[employeeIdx].vacations[vacationIdx].date_end) && 
					   (employeesArray[r].vacations[d].date_end >= employeesArray[employeeIdx].vacations[vacationIdx].date_begin)) {
						if (employeesArray[r].vacations[d].date_begin < minDateBegin) {
							minDateBegin = new Date(employeesArray[r].vacations[d].date_begin);
						}
						if (employeesArray[r].vacations[d].date_end > maxDateEnd) {
							maxDateEnd = new Date(employeesArray[r].vacations[d].date_end);
						}
						if (employeeIdxsArray.indexOf(r) == -1) {
							employeeIdxsArray.push(r);
							employeeWorkDaysArray.push({"workDaysCount": 0, "isFirst": false});
						}
					}
				}
			}
		}
		if (minDateBegin > new Date(yearValue, 0, 1)) {
			minDateBegin.setDate(minDateBegin.getDate() - 1);
		}
		if (maxDateEnd < new Date(yearValue, 11, 31)) {
			maxDateEnd.setDate(maxDateEnd.getDate() + 1);
		}

		for (var i = 0; i < 12; i++) {
			if ((i > minDateBegin.getMonth()) && (i < maxDateEnd.getMonth())) {
				daysInMonths.push(33 - new Date(yearValue, i, 33).getDate());			
			} else if ((i == minDateBegin.getMonth()) && (i == maxDateEnd.getMonth())) {
				daysCount = maxDateEnd.getDate() - minDateBegin.getDate() + 1;
				if (daysCount < 3) {
					daysCount = 3;
					if (minDateBegin.getDate() == 1) {
						maxDateEnd = new Date(yearValue, i, 3);
					} else {
						minDateBegin = new Date(yearValue, i, 29);
					}
				}			
				daysInMonths.push(daysCount);
				
			} else if (i == minDateBegin.getMonth()) {
				daysCount = 33 - new Date(yearValue, i, 33).getDate() - minDateBegin.getDate() + 1;
				if (daysCount < 3) {
					daysCount = 3;
					minDateBegin = new Date(yearValue, i, 33 - new Date(yearValue, i, 33).getDate() - 2);
				}
				daysInMonths.push(daysCount);
			} else if (i == maxDateEnd.getMonth()) {
				daysCount = maxDateEnd.getDate();
				if (daysCount < 3) {
					daysCount = 3;
					maxDateEnd = new Date(yearValue, i, 3);				
				}
				daysInMonths.push(daysCount);
			} else {
				daysInMonths.push(0);
			}
		}
		
		var vacBlockX = 132 + 22 * getDateDiff(minDateBegin, employeesArray[employeeIdx].vacations[vacationIdx].date_begin);
		var vacBlockWidth = 2 + 22 * (employeesArray[employeeIdx].vacations[vacationIdx].days + employeesArray[employeeIdx].vacations[vacationIdx].holidays);
		var vacBlockStr = "<div style='position:absolute;top:0px;left:" + vacBlockX + "px;width:" + vacBlockWidth;
		vacBlockStr += "px;height:100%;background-color:rgba(240, 160, 20, 0.15);pointer-events:none;'></div>";
		vacBlockStr += "<div style='position:absolute;top:100%;left:" + (vacBlockX - 2) + "px;width:" + (vacBlockWidth + 4); 
		vacBlockStr += "px;height:3px;background-color:rgba(240, 160, 20, 0.75);'></div>";
		vacBlockStr += "<div style='position:absolute;top:-3px;left:" + (vacBlockX - 2) + "px;width:" + (vacBlockWidth + 4);
		vacBlockStr += "px;height:3px;background-color:rgba(240, 160, 20, 0.75);'></div>";
	}
	
	var calendarDaysCount = getDateDiff(minDateBegin, maxDateEnd) + 1;
	var curDateCalc = new Date(minDateBegin);

	var todayIdx = -1;
	for (var d = 0; d < calendarDaysCount; d++) {
		if (curDateCalc.getTime() == curDate.getTime()) {
			todayIdx = d;
		}
		calendarArray[0][d] = {};
		if (typeof vacationIdx != "undefined") {
			calendarArray[0][d]['isIntersection'] = ((employeesArray[employeeIdx].vacations[vacationIdx].date_begin <= curDateCalc) && 
													 (employeesArray[employeeIdx].vacations[vacationIdx].date_end >= curDateCalc));
		}
		calendarArray[0][d]['day'] = curDateCalc.getDate();
		calendarArray[0][d]['weekday'] = curDateCalc.getDay();
		calendarArray[0][d]['isHoliday'] = (calendarArray[0][d]['weekday'] == 0) || (calendarArray[0][d]['weekday'] == 6); 
		workCalendarDay = workCalendarArray[formatDate(curDateCalc, true)];
		if (typeof workCalendarDay != "undefined") {
			calendarArray[0][d]['isHoliday'] = workCalendarDay['type'] != 3;
			calendarArray[0][d]['title'] = workCalendarDay['text'];
		}
		for (var r1 = 0; r1 < employeeIdxsArray.length; r1++) {
			calendarArray[r1+1][d] = -1;
			e1 = employeeIdxsArray[r1];
			for (var d1 = 0; d1 < employeesArray[e1].vacations.length; d1++) {
				if ((employeesArray[e1].vacations[d1].date_begin <= curDateCalc) && (employeesArray[e1].vacations[d1].date_end >= curDateCalc)) {
					calendarArray[r1+1][d] = employeesArray[e1].vacations[d1].is_approved * 10 + employeesArray[e1].vacations[d1].type_id;
					calendarArray[r1+1][d] += vacationTypes[employeesArray[e1].vacations[d1].type_id].without_approval * 10;
				}
			}
		}					
		curDateCalc.setDate(curDateCalc.getDate() + 1);					
	}
	
	if (typeof vacationIdx == "undefined") {	
		divStr = "<div id='calendarBoxMain' class='calendarBoxInner' onscroll='hidePopupBox();' onmousedown='onMouseDownInTable();' ";
		divStr += "onmousemove='onMouseMoveInTable();' ondragstart='onDragStartInTable();'>";	
		divStr += "<table class='calendarTable' onclick='event.stopPropagation();clickCalendar();'>";
	} else {
		divStr = "<div id='calendarBoxMf' class='calendarBoxInner' style='overflow-x: visible;'>";	
		divStr += "<table class='calendarTable'>" + vacBlockStr;	
	}
	var line1 = "<tr class='tblHeader'><th class='lth'></th>";
	var line2 = "<tr class='tblHeader'><th class='lth'></th>";
	var line3 = "<tr class='tblHeader'><th class='lth'></th>";
	for (var m = 0; m < daysInMonths.length; m++) {
		if (daysInMonths[m] > 0) {
			line1 += "<td colspan='" + daysInMonths[m] + "'>" + monthNames[m] + "</td>";	
		}
	}
	for (var d = 0; d < calendarDaysCount; d++) {
		dayClassNameDay = "";
		dayClassNameWeekday = "";
		if (calendarArray[0][d]['isHoliday']) {
			dayClassNameDay = "calendarHoliday";
		}
		if ((calendarArray[0][d]['weekday'] == 0) || (calendarArray[0][d]['weekday'] == 6)) {
			dayClassNameWeekday = "calendarHoliday";
		}
		if (d == todayIdx) {
			dayClassNameDay = dayClassNameDay + " calendarToday";
			dayClassNameWeekday	= dayClassNameWeekday + " calendarToday";		
		}
		if (dayClassNameDay != '') {
			dayClassNameDay = " class='" + dayClassNameDay + "'";	
		}
		if (dayClassNameWeekday != '') {
			dayClassNameWeekday = " class='" + dayClassNameWeekday + "'";	
		}			
		line2 += "<td" + dayClassNameDay;
		if (typeof calendarArray[0][d]['title'] != "undefined") {
			line2 += " data-bs-toggle='tooltip' data-bs-placement='top' title='" + calendarArray[0][d]['title'] + "'";
		}
		line2 += ">" + calendarArray[0][d]['day'] + "</td>";	
		line3 += "<td" + dayClassNameWeekday + ">" + dayNames[calendarArray[0][d]['weekday']] + "</td>";	
	}
	divStr += line1 + "<th class='rth d-grid gap-2 d-md-flex justify-content-md-end'>";
	if (typeof vacationIdx == "undefined") {
		divStr += "<span id='calendarInfoIcon' class='info_icon fa fa-info-circle px-1' onmouseover='event.stopPropagation();viewCalendarInfo();' ";
		divStr += "onmouseout='event.stopPropagation();hidePopupBox();'></span>";
	}
	divStr += "</th></tr>" + line2 + "<th class='rth'></th></tr>" + line3 + "<th class='rth'></th></tr>";

	
	for (var r1 = 0; r1 < employeeIdxsArray.length; r1++) {	
		short_name = employeesArray[employeeIdxsArray[r1]].short_name;
		if (((typeof vacationIdx == "undefined") && (userId == employeesArray[employeeIdxsArray[r1]].user_id)) || 
		   ((typeof vacationIdx != "undefined") && (r1 == 0))) { 
			short_name = "<b>" + short_name + "</b>";
		}
		if (typeof vacationIdx != "undefined") {
			employeeWorkDaysArray[r1]["name"] = short_name;
		}		
		divStr += "<tr><th class='lth'>" + short_name + "</th>";
		for (var d = 0; d < calendarDaysCount; d++) {
			var className = "calendarEmpty";
			var cellText = "";		
			if (calendarArray[r1+1][d] >= 0) {
				if (calendarArray[r1+1][d] < 10) {				
					className = "calendarVac";				
				} else if (calendarArray[r1+1][d] >= 10) {
					className = "calendarVacGood";
				}
				if (calendarArray[r1+1][d] % 10 == 2) {
					className += " calendarVacPastYear";					
				} else if (calendarArray[r1+1][d] % 10 == 3) {
					className = "calendarVacSick";					
				} else if (calendarArray[r1+1][d] % 10 == 5) {
					className += " calendarVacWithoutPay";	
				}
				if ((typeof vacationIdx != "undefined") && (calendarArray[0][d]['isIntersection']) && (!calendarArray[0][d]['isHoliday'])) {
					employeeWorkDaysArray[r1].workDaysCount += 1;
				}			
			}	
			if (calendarArray[0][d]['isHoliday']) {
				className =  className + " calendarGrey";
			}
			if (d == todayIdx) {
				className = className + " calendarToday";
			}				
			divStr += "<td class='" + className + "'>" + cellText + "</td>";
		}
		divStr += "<th class='rth'>" + short_name + "</th></tr>";		
	}				
	divStr += "</table></div>";
		
	return [divStr, todayIdx, calendarDaysCount, employeeWorkDaysArray];
}

function refreshCalendar() {
	if (employeesArray.length == 0) {
		divStr = "<div class='p-3'><div class='alert alert-info'>Данные отсутствуют. Попробуйте ";
		divStr += "<u><span onclick='event.stopPropagation();viewMfCalendarFilter();return false;'>изменить фильтрацию</span></u>.</div></div>";	
		document.getElementById("calendarBoxOuter").innerHTML = divStr;
		return false;	
	}
	
	calendarStr = getCalendarStr();
	divStr = calendarStr[0];
	todayIdx = calendarStr[1]; 
	calendarDaysCount = calendarStr[2];
	document.getElementById("calendarBoxOuter").innerHTML = divStr;
	
	if (scrollPos > -1) {
		document.getElementById("calendarBoxMain").scrollLeft = scrollPos;	
	} else {
		document.getElementById("calendarBoxMain").scrollLeft = 0;
		if (todayIdx > 6) {
			document.getElementById("calendarBoxMain").scrollLeft = 2 + (todayIdx - 7) * document.getElementById("calendarBoxMain").scrollWidth / calendarDaysCount;
		}
	}
	document.body.onmouseup = onMouseUpInTable;
}

function viewCalendarInfo() {
	viewPopupBox(calendarInfoText, document.getElementById("calendarBoxMain").offsetWidth,
	 document.getElementById("calendarBoxOuter").offsetTop + document.getElementById("calendarInfoIcon").offsetHeight / 2, 
	 document.getElementById("calendarBoxOuter").offsetWidth - document.getElementById("calendarInfoIcon").offsetWidth);
}

function viewFilterInfo() {	
	viewPopupBox(calendarFilterText, document.getElementById("filterBtn").offsetLeft + document.getElementById("filterBtn").offsetWidth, 
	document.getElementById("filterBtn").offsetTop + document.getElementById("filterBtn").offsetHeight / 2, document.body.offsetWidth);
	tooltip = document.getElementById("popupBox");
	tooltip.style.left = (tooltip.offsetLeft + 4) + "px";
}

function onMouseDownInTable() {
	if ((event.pageX > document.getElementById("calendarBoxMain").offsetLeft) && 
		(event.pageX < document.getElementById("calendarBoxMain").offsetWidth + document.getElementById("calendarBoxMain").offsetLeft)) {
		hidePopupBox();
		event.stopPropagation();
		calendarScrollX = event.pageX;
		calendarScrollAll = event.pageX; 
	}
}

function onMouseMoveInTable() {
	if ((event.pageX > document.getElementById("calendarBoxMain").offsetLeft) && 
		(event.pageX < document.getElementById("calendarBoxMain").offsetWidth + document.getElementById("calendarBoxMain").offsetLeft)) {
		if (calendarScrollX > -1) {
			event.stopPropagation();
			deltaX = event.pageX - calendarScrollX;
			document.getElementById("calendarBoxMain").scrollLeft -= deltaX;			 
			calendarScrollX = event.pageX;
		} 
	}
}

function onMouseUpInTable() {
	event.stopPropagation();
	calendarScrollX = -1;
	if (calendarScrollAll > -1) {
		calendarScrollAll = Math.abs(calendarScrollAll - event.pageX);
	}
}

function onDragStartInTable() {
	return false;
}

function checkVacationsInYear() {
	var yearDateBegin = new Date(yearValue + "-01-01");
	var formNearbyVacationsArray = [];				
	var formPastVacationsArray = [];
	var formWrongDaysCountInYearArray = [];				
	var formNoLongVacationInYearArray = [];
	var formUnusedVacationDaysArray = [];
	for (var e = 0; e < employeesArray.length; e++) {
		if ((employeesArray[e].user_id == userId) || (employeesArray[e].chief_id == userId) || ((userRights.indexOf("assistantChief") > -1) && (employeesArray[e].chief_id == userChiefId))) {
		
			if ((employeesArray[e].chief_id == userId) || ((userRights.indexOf("assistantChief") > -1) && (employeesArray[e].chief_id == userChiefId))) {
				if (employeesArray[e].unused_vacation_days !== 0) {
					formUnusedVacationDaysArray.push({"name": employeesArray[e].short_name, "days": employeesArray[e].unused_vacation_days});	
				}
			}			
			var vacationDays = 0;
			var existBigVacation = false;		
			for (var v = 0; v < employeesArray[e].vacations.length; v++) {
				vac = employeesArray[e].vacations[v];
				vac['check_type'] = '';
				vac['check_text'] = '';
				if (vac.type_id == 1) {
					vacationDays += vac.days;
					if (vac.days >= vacationDaysInOne) {
						existBigVacation = true;	
					}
				} 
				if ((vac.is_approved == 0) && (vacationTypes[vac.type_id].without_approval == 0)) {
					if (vac.date_begin <= curDate) {
						vac['check_type'] = 'danger';
						vac['check_text'] = 'Прошедший несогласованный отпуск, необходимо согласовать или удалить';
						formPastVacationStr = "<tr><td class='sc-header sc-line'>";
						formPastVacationStr += employeesArray[e].short_name + "</td>" + getTableVacationStr(e, v) + "</tr>";	
						formPastVacationsArray.push(formPastVacationStr);
					} else {
						var diffInDays = getDateDiff(curDate, vac.date_begin);
						if (diffInDays <= 30) {
							vac['check_type'] = 'warning';
							vac['check_text'] = 'Несогласованный отпуск, до начала отпуска ' + formatDaysCount(diffInDays);							
							formNearbyVacationStr = "<tr><td class='sc-header sc-line'>";
							formNearbyVacationStr += employeesArray[e].short_name + "</td>" + getTableVacationStr(e, v) + "</tr>";	
							formNearbyVacationsArray.push({"date_begin": employeesArray[e].vacations[v].date_begin, "msg": formNearbyVacationStr});
						}
					}						
				}
			}
			var dateBegin = new Date(employeesArray[e].date_create);
			if ((dateBegin <= yearDateBegin) && (employeesArray[e].date_close == null)) {
				if (vacationDays != vacationDaysInYear) {
					formWrongDaysCountInYearStr = "<tr><td class='sc-header sc-line'>";					
					formWrongDaysCountInYearStr +=  employeesArray[e].short_name + "</td><td class='sc-line'>";
					formWrongDaysCountInYearStr += formatCalendarDaysCount(vacationDays) + "</td></tr>";
					formWrongDaysCountInYearArray.push(formWrongDaysCountInYearStr);
				}
				if (!existBigVacation) {
					formNoLongVacationInYearStr = "<tr><td class='sc-header sc-line'>";
					formNoLongVacationInYearStr += employeesArray[e].short_name + "</td></tr>";
					formNoLongVacationInYearArray.push(formNoLongVacationInYearStr);					
				}
			}
		}
	}
	
	var formMsgArray = [];
	if (formUnusedVacationDaysArray.length > 0) {
		if (formUnusedVacationDaysArray.length > 1) {
			formUnusedVacationDaysArray.sort(function(obj1, obj2) {
				let days1 = Math.abs(obj1.days);
				if (obj1.days < 0) {
					days1 += 100000;
				}
				let days2 = Math.abs(obj2.days);
				if (obj2.days < 0) {
					days2 += 100000;
				}
				return days2 - days1;
			});
		}
		for (var j = 0; j < formUnusedVacationDaysArray.length; j++) {
			formUnusedVacationDaysStr = "<tr><td class='sc-header sc-line'>";					
			formUnusedVacationDaysStr += formUnusedVacationDaysArray[j].name + "</td><td class='sc-line'>";
			formUnusedVacationDaysStr += formatCalendarDaysCount(formUnusedVacationDaysArray[j].days) + "</td></tr>";
			formUnusedVacationDaysArray[j] = formUnusedVacationDaysStr;
		}		
		formMsgArray.push({"code": "unusedVacationDays", "name": "Осталось неиспользованного отпуска с прошлых лет", "type": "info", "msg": formUnusedVacationDaysArray});
	}
	if (formNearbyVacationsArray.length > 0) {
		if (formNearbyVacationsArray.length > 1) {
			formNearbyVacationsArray.sort(function(obj1, obj2) {
				if (obj1.date_begin < obj2.date_begin) return -1;
				if (obj1.date_begin > obj2.date_begin) return 1;
				return 0;
			});
		}
		for (var j = 0; j < formNearbyVacationsArray.length; j++) {
			formNearbyVacationsArray[j] = formNearbyVacationsArray[j].msg;
		}
		formMsgArray.push({"code": "nearbyVacations", "name": "Ближайшие несогласованные отпуска", "type": "warning", "msg": formNearbyVacationsArray});
	}
	if (formPastVacationsArray.length > 0) {
		formMsgArray.push({"code": "pastVacations", "name": "Прошедшие несогласованные отпуска (необходимо согласовать их или удалить)", "type": "danger", "msg": formPastVacationsArray});
	}
	if (formWrongDaysCountInYearArray.length > 0) {
		formMsgArray.push({"code": "wrongDaysCountInYear", "name": "Общее количество календарных дней отпуска за " + yearValue + " год не совпадает с требуемым (" + 
						vacationDaysInYear + ")", "type": "danger", "msg": formWrongDaysCountInYearArray});
	}
	if (formNoLongVacationInYearArray.length > 0) {
		formMsgArray.push({"code": "noLongVacationInYear", "name": "За " + yearValue + " год отсутствует отпуск с продолжительностью " + vacationDaysInOne + 
						" или более календарных дней", "type": "danger", "msg": formNoLongVacationInYearArray});
	}					
	return formMsgArray;
}

function changeVacationApprove(isApprove, employeeIdx, vacationIdx) {
	var vacationId = employeesArray[employeeIdx].vacations[vacationIdx].id;
	var newApproveValue = isApprove == 1 ? 1 : 0;
	sendRequest({"actionType": "calendar", "actionName": "changeVacationApprove", "newApproveValue": newApproveValue, "vacationId": vacationId})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			refreshAll();	
		}
	});
}

function viewMfVacationInfo(employeeIdx, vacationIdx) {
	calendarStr = getCalendarStr(employeeIdx, vacationIdx);
	calendarDivStr = calendarStr[0];
	calendarDaysCount = calendarStr[2];
	employeeWorkDaysArray = calendarStr[3];
	
	divStr = "<div class='no-padding row'><div class='col align-self-start'>" + employeeWorkDaysArray[0].name + "<br><br>";
	vacStatusStr = "";
	if (vacationTypes[employeesArray[employeeIdx].vacations[vacationIdx].type_id].without_approval == 0) {
		if (employeesArray[employeeIdx].vacations[vacationIdx].is_approved == 1) {
			approvedText = "Согласован";
			approvedImg = "fa-check-circle-o";
			approvedColor = "success";
		} else {
			approvedText = "Не согласован";
			approvedImg = "fa-ban";
			approvedColor = "danger";	
		}
		divStr += "<span class='fa " + approvedImg + "' style='color: var(--sc-bg-color-" + approvedColor + ");'></span> " + approvedText;
		
		vacStatusStr = "<br><span class='calendarGrey'>";
		if (employeesArray[employeeIdx].vacations[vacationIdx].date_end < curDate) {
			vacStatusStr += "прошедший отпуск";
		} else if (employeesArray[employeeIdx].vacations[vacationIdx].date_begin <= curDate) {
			vacStatusStr += "отпуск идёт в данный момент";
		} else {
			diffInDays = getDateDiff(curDate, employeesArray[employeeIdx].vacations[vacationIdx].date_begin);
			vacStatusStr += "до начала отпуска " + formatDaysCount(diffInDays);	
		}
		vacStatusStr += "</span>";			
	}
	divStr += "<br>" + vacationTypes[employeesArray[employeeIdx].vacations[vacationIdx].type_id].name + "<br>";
	divStr += "с " + formatDate(employeesArray[employeeIdx].vacations[vacationIdx].date_begin, false, true);
	divStr += " по " + formatDate(employeesArray[employeeIdx].vacations[vacationIdx].date_end, false, true) + vacStatusStr;
	divStr += "<br><br></div><div class='col col-auto'>Общая продолжительность - ";
	divStr += formatDaysCount(employeesArray[employeeIdx].vacations[vacationIdx].days + employeesArray[employeeIdx].vacations[vacationIdx].holidays);
	divStr += ",<br>из них:<div class='ms-3'> • " + formatWorkDaysCount(employeeWorkDaysArray[0].workDaysCount) + "<br><span class='calendarGrey'> • ";
	divStr += formatCalendarDaysCount(employeesArray[employeeIdx].vacations[vacationIdx].days);
	if (employeesArray[employeeIdx].vacations[vacationIdx].holidays > 0) {
		divStr += "<br> • " + formatHolidaysCount(employeesArray[employeeIdx].vacations[vacationIdx].holidays);
	}
	divStr += "</span></div></div></div></div>";
	
	divStr += "<div id='calendarBoxOuterMf' class='calendarBoxOuter unselectable' style='display: inline-block;'>" + calendarDivStr + "</div>";	
	
	if (employeeWorkDaysArray.length > 1) {
		var employeeWorkDaysStr = "<div class='no-padding'><span class='calendarGrey'>Пересечение с отпусками других сотрудников:</span>";
		employeeWorkDaysArray.sort(function(obj1, obj2) {
			if (obj1.isFirst) return 1;
			if (obj1.workDaysCount < obj2.workDaysCount) return 1;
			if (obj1.workDaysCount > obj2.workDaysCount) return -1;
			return 0;
		});
		employeeWorkDays1ColStr = "";
		employeeWorkDays1Co2Str = "";
		for (var r = 1; r < employeeWorkDaysArray.length; r++) {		
			employeeWorkDays1ColStr += employeeWorkDaysArray[r].name + "<br>";
			employeeWorkDays1Co2Str += " • " + formatWorkDaysCount(employeeWorkDaysArray[r].workDaysCount) + "<br>";
		}
		employeeWorkDaysStr += "<div class='row'><div class='col col-auto ms-3'>" + employeeWorkDays1ColStr;
		employeeWorkDaysStr += "</div><div class='col ms-0 col-auto'>" + employeeWorkDays1Co2Str + "</div></div></div>";
		divStr += employeeWorkDaysStr;
	}	
	
	showModal("Карточка отпуска", divStr, null, false, true);	
	refreshTooltips("calendarBoxOuterMf");
}

function showEditVacation(employeeIdx, vacationIdx, clickDate) {
	if (vacationIdx == -1) {
		var typeVacationId = 1;
		var dateBegin = new Date(clickDate);
		var dateEnd = new Date(clickDate);
		var daysCount = 1;
		var holidaysCount = 0;
		var formTitle = "Добавление нового отпуска";
	} else {
		var typeVacationId = employeesArray[employeeIdx].vacations[vacationIdx].type_id;
		var dateBegin = employeesArray[employeeIdx].vacations[vacationIdx].date_begin;
		var dateEnd = employeesArray[employeeIdx].vacations[vacationIdx].date_end;
		var daysCount = employeesArray[employeeIdx].vacations[vacationIdx].days;
		var holidaysCount = employeesArray[employeeIdx].vacations[vacationIdx].holidays;
		var formTitle = "Редактирование отпуска (" + formatDate(dateBegin) + "-" + formatDate(dateEnd, false, true) + ")";		
	}
	var formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Тип отпуска</div>";
	formStr += "<div class='col col-8'><select class='form-select' id='vacationTypeEdit'>";
	for (var key in vacationTypes) {
		formStr += "<option value='" + vacationTypes[key].id + "'";
		if (typeVacationId == vacationTypes[key].id) {
			formStr += " selected";
		}
		formStr +=" >" + vacationTypes[key].name + "</option>";	
	}	
	formStr += "</select></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Дата начала</div>";
	formStr += "<div class='col col-5'><input type='date' class='form-control' id='dateBeginEdit' value='" + formatDate(dateBegin, true);
	formStr += "' max='" + yearValue + "-12-31' min='" + yearValue + "-01-01' onchange='checkVacation(" + employeeIdx + ", " + vacationIdx + ");'>";
	formStr += "</div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Дата окончания</div>";
	formStr += "<div class='col col-5'><input type='date' class='form-control' id='dateEndEdit' value='" + formatDate(dateEnd, true);
	formStr += "' disabled></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Количество дней</div>";
	formStr += "<div class='col col-3'><input type='number' class='form-control' id='daysCountEdit' value='" + daysCount;
	formStr += "' max='" + vacationDaysInYear + "' min='1' onchange='checkVacation(" + employeeIdx + ", " + vacationIdx + ");'>";
	formStr += "<input type='hidden' id='correctDaysCountEdit' value='" + holidaysCount + "'></div>";
	formStr += "<div class='col col-5 my-auto calendarGrey'><span id='correctDaysCountSpan'></span></div></div>";
	
	formStr += "<div class='hidden' id='errorMsgArea'></div>";

	showModal(formTitle, formStr, [{'className':'btn-secondary', 'dismiss':'1', 'text':'<span class="fa fa-close"></span>Отмена'},
	{'className':'btn-primary', 'onclick':'saveVacation(' + employeeIdx + ', ' + vacationIdx + ');return false;', 
	'text':'<span class="fa fa-check"></span>Сохранить'}]);
	checkVacation(employeeIdx, vacationIdx);
}

function checkVacation(employeeIdx, vacationIdx) {
	document.getElementById("errorMsgArea").className = "hidden";
	var errorMsgText = [];
	
	if (typeof document.getElementById("vacationTypeEdit").value == "undefined") {
		document.getElementById("vacationTypeEdit").value = 1;
	}
	
	var dateBegin = new Date(document.getElementById("dateBeginEdit").value);
	if (dateBegin.getFullYear() != yearValue) {
		dateBegin = new Date(yearValue + "-01-01");
		errorMsgText.push({"type": "info", "text": "Период не должен выходить за пределы " + yearValue + " года.<br>Дата начала изменена на " + formatDate(dateBegin, false, true) + "."});
	}
	var daysCount = parseInt(document.getElementById("daysCountEdit").value, 0);
	if (daysCount < 1) {
		daysCount = 1;
		errorMsgText.push({"type": "info", "text": "Количество календарных дней не может быть меньше одного.<br>Изменено на " + daysCount + "."});
	} else if (daysCount > vacationDaysInYear) {
		daysCount = vacationDaysInYear;	
		errorMsgText.push({"type": "info", "text": "Количество календарных дней не может быть больше " + formatDaysCount(vacationDaysInYear) + ".<br>Изменено на " + daysCount + "."});				
	} 
	var correctDaysCount = parseInt(document.getElementById("correctDaysCountEdit").value, 0);
	var dateEnd = new Date(dateBegin);
	dateEnd.setDate(dateEnd.getDate() + daysCount + correctDaysCount - 1);
	correctDaysCount = 0;
	correctDaysText = "";
	for (var dayKey in workCalendarArray) {
		if (workCalendarArray[dayKey]['type'] == 1) {
			dayDate = new Date(dayKey);
			if ((dayDate >= dateBegin) && (dayDate <= dateEnd)) {
				correctDaysCount += 1;
				correctDaysText += " • " + formatDate(dayDate);
			}
		}
	}	
	dateEnd = new Date(dateBegin);
	dateEnd.setDate(dateEnd.getDate() + daysCount + correctDaysCount - 1);
	if (dateEnd.getFullYear() != yearValue) {
		dateEnd = new Date(yearValue + "-12-31");
		daysCount = (dateEnd - dateBegin) / (1000 * 3600 * 24) + 1 - correctDaysCount;
		errorMsgText.push({"type": "info", "text": "Период не должен выходить за пределы " + yearValue + " года.<br>Количество дней изменено на " + daysCount + "."});	
	}
	
	document.getElementById("dateBeginEdit").value = formatDate(dateBegin, true);
	document.getElementById("daysCountEdit").value = daysCount;
	document.getElementById("dateEndEdit").value = formatDate(dateEnd, true);
	document.getElementById("correctDaysCountEdit").value = correctDaysCount;
	if (correctDaysCount == 0) {
		document.getElementById("correctDaysCountSpan").innerHTML = "";	
	} else {
		document.getElementById("correctDaysCountSpan").innerHTML = "+" + formatHolidaysCount(correctDaysCount) + "<br>" + correctDaysText;		
	}
	
	msgText = "";
	for (var d1 = 0; d1 < employeesArray[employeeIdx].vacations.length; d1++) {
		if ((d1 != vacationIdx) && (employeesArray[employeeIdx].vacations[d1].date_begin <= dateEnd) && 
			(employeesArray[employeeIdx].vacations[d1].date_end >= dateBegin)) {
				msgText += "<br> • " + formatDate(employeesArray[employeeIdx].vacations[d1].date_begin, false, true) + " - " + 
				formatDate(employeesArray[employeeIdx].vacations[d1].date_end, false, true);						
		}
	}
	if (msgText != "") {
		errorMsgText.push({"type": "danger", "text": "Отпуск пересекается с запланированным ранее:" + msgText});
	}
	if (errorMsgText.length > 0) {
		msgText = "";
		for (var i = 0; i < errorMsgText.length; i++) {
			msgText += "<div class='alert alert-" + errorMsgText[i]["type"] + "'>" + errorMsgText[i]["text"] + "</div>";		
		}
		document.getElementById("errorMsgArea").className = "";
		document.getElementById("errorMsgArea").innerHTML = msgText;
	}
	return errorMsgText.length == 0;
}

function saveVacation(employeeIdx, vacationIdx) {
	if (checkVacation(employeeIdx, vacationIdx)) {	
		var actionName = "editVacation";
		var employeeId = employeesArray[employeeIdx].id;
		var newDateBegin = new Date(document.getElementById("dateBeginEdit").value);
		newDateBegin = formatDate(newDateBegin, true);
		var newDaysCount = parseInt(document.getElementById("daysCountEdit").value, 0);
		var newHolidaysCount = parseInt(document.getElementById("correctDaysCountEdit").value, 0);		
		var type_id = document.getElementById("vacationTypeEdit").value;
		if (vacationIdx == -1) {
			actionName = "addVacation";
			var vacationId = null;
		} else {
			var vacationId = employeesArray[employeeIdx].vacations[vacationIdx].id;
		}		
		sendRequest({"actionType": "calendar", "actionName": actionName, "employeeId": employeeId, "typeId": type_id, 
					 "dateBegin": newDateBegin, "days": newDaysCount, "holidays": newHolidaysCount, "vacationId": vacationId})
		.then(function(jsonResponse) {
			if (jsonResponse["msgStatus"] == "success") {
				hideModal();	
				refreshAll();			
			}
		});
	}
}

function showDeleteVacation(employeeIdx, vacationIdx) {
	formStr = "<div class='row m-3 justify-content-center'>Вы действительно хотите удалить ";
	formStr += vacationTypes[employeesArray[employeeIdx].vacations[vacationIdx].type_id].name.toLowerCase();
	formStr += "<br/>с " + formatDate(employeesArray[employeeIdx].vacations[vacationIdx].date_begin, false, true);
	formStr += " по " + formatDate(employeesArray[employeeIdx].vacations[vacationIdx].date_end, false, true) + " (";  
	formStr += formatCalendarDaysCount(employeesArray[employeeIdx].vacations[vacationIdx].days);
	if (employeesArray[employeeIdx].vacations[vacationIdx].holidays > 0) {
		formStr += " +" + formatHolidaysCount(employeesArray[employeeIdx].vacations[vacationIdx].holidays);
	}
	formStr += ")?</div>";
	showModal("Удалить отпуск", formStr, [{'className':'btn-secondary', 'dismiss':'1', 'text':'<span class="fa fa-close"></span>Отмена'},
	{'className':'btn-primary', 'dismiss':'1', 'onclick':'deleteVacation(' + employeeIdx + ', ' + vacationIdx + ');return false;', 
	'text':'<span class="fa fa-check"></span>Удалить'}]);	
}

function deleteVacation(employeeIdx, vacationIdx) {
	var vacationId = employeesArray[employeeIdx].vacations[vacationIdx].id;
	sendRequest({"actionType": "calendar", "actionName": "deleteVacation", "vacationId": vacationId})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			refreshAll();			
		}
	});	
}

function viewMfPrintVacation(employeeIdx, vacationIdx) {
	var printDate = new Date(curDate);
	var maxDate = new Date(employeesArray[employeeIdx].vacations[vacationIdx].date_begin);
	maxDate.setDate(maxDate.getDate() - 1);		
	if (printDate > maxDate) {
		printDate = new Date(maxDate);
		printDate.setDate(printDate.getDate() - 14);		
	}	
	var formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Дата подписания</div>";
	formStr += "<div class='col col-5'><input type='date' class='form-control' id='datePrintEdit' value='" + formatDate(printDate, true);
	formStr += "' max='" + formatDate(maxDate, true) + "'></div></div>";	
	formStr += "<div class='row mb-2'><div class='col col-4'></div><div class='col col-auto'><div class='form-check'>";
	formStr += "<input class='form-check-input' id='withoutDatePrint' type='checkbox' onclick='changeDatePrintEdit();'>";
	formStr += "<label class='form-check-label calendarGrey' for='withoutDatePrint'>Без даты подписания</label></div></div></div>";	
	showModal("Распечатать заявление на отпуск", formStr, [{'className':'btn-secondary', 'dismiss':'1', 'text':'<span class="fa fa-close"></span>Отмена'},
	{'className':'btn-primary', 'dismiss':'1', 'onclick':'printVacation(' + employeeIdx + ', ' + vacationIdx + ');return false;', 
	'text':'<span class="fa fa-check"></span>Распечатать'}]);	
}

function changeDatePrintEdit() {
	document.getElementById("datePrintEdit").disabled = document.getElementById("withoutDatePrint").checked;	
}

function printVacation(employeeIdx, vacationIdx) {
	var vacationId = employeesArray[employeeIdx].vacations[vacationIdx].id;
	var printForm = vacationTypes[employeesArray[employeeIdx].vacations[vacationIdx].type_id].print_form;
	var printDate = "";
	if (!document.getElementById("withoutDatePrint").checked) {
		printDate = new Date(document.getElementById("datePrintEdit").value);
		printDate = formatDate(printDate, true);
	}
	sendRequest({"actionType": "print", "actionName": "printVacation", "formCode": printForm, "vacationId": vacationId, "printDate": printDate})
	.then(function(jsonResponse) {
		window.open("print", "Заявление на отпуск " + formatDate(employeesArray[employeeIdx].vacations[vacationIdx].date_begin, false, true));
	});
}

