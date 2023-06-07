var calendarsArray = [];
var daysArray = [];
var filterYearArray = [];

function refreshAll() {
	showScreenLoader();
	let FilterYear = "";
	sendRequest({"actionType": "admin.calendar", "actionName": "getLastYear"}).then(function(jsonResponse) {
		filterYearArray = jsonResponse["last_year"];
	});	
	sendRequest({"actionType": "admin.calendar", "actionName": "getDays"}).then(function(jsonResponse) {
		daysArray = jsonResponse["day"];
	});
	sendRequest({"actionType": "admin.calendar", "actionName": "getFilters"}).then(function(jsonResponse) {
		filterArray = jsonResponse["filter"]
		tableRequestInfo ();
	});
	/* sendRequest({"actionType": "admin.calendar", "actionName": "getCalendars", "FilterYear": FilterYear})
	.then(function(jsonResponse) {
		calendarsArray = jsonResponse["data"];
		refreshCalendarsTable();
	}); */
	

}

function tableRequestInfo (){
	FilterYear = filterYearArray[0].year;
	sendRequest({"actionType": "admin.calendar", "actionName": "getCalendars", "FilterYear": FilterYear})
	.then(function(jsonResponse) {
		calendarsArray = jsonResponse["data"];
		refreshCalendarsTable();
	});
}

function refreshYear() {
	FilterYear = document.getElementById("YearFilterEdit").value;
	hideModal();
	showScreenLoader();
	sendRequest({"actionType": "admin.calendar", "actionName": "getDays"}).then(function(jsonResponse) {
		daysArray = jsonResponse["day"];
	});
	sendRequest({"actionType": "admin.calendar", "actionName": "getFilters"}).then(function(jsonResponse) {
		filterArray = jsonResponse["filter"];
	});
	sendRequest({"actionType": "admin.calendar", "actionName": "getCalendars", "FilterYear": FilterYear})
	.then(function(jsonResponse) {
		calendarsArray = jsonResponse["data"];
		refreshCalendarsTable();
	});
}

function getTableBtnStr(btnTitle, btnImg, btnOnClick) {
	let tableBtnStr = "<button type='button' class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
	tableBtnStr += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='" + btnTitle + "' ";
	tableBtnStr += "onclick='" + btnOnClick + ";return false;'><span class='fa " + btnImg + "'></span></button>";
	return tableBtnStr;
}

function refreshCalendarsTable() {
	let yearValue = "2023";
	divStr = "<div class='h3 alert'>Просмотр и редактирование календарных дней</div>";
	divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Фильтр", "fa fa-filter", "showFilter(-1)") + "</td>";
	
	divStr += "<div id='calendarBoxOuter' class='calendarBoxOuter'>";
	divStr += "<div class='d-flex mx-3'><table class='sc-table'>";
	divStr += "<tr class='sc-header'><td class='sc-btn-td sc-line'>Дата</td><td class='sc-btn-td sc-line'>Тип</td><td class='sc-btn-td sc-line'>Название</td></tr>";
	
	for (let i = 0; i < calendarsArray.length; i++) {
		divStr += "<tr><td class='sc-line'>" + calendarsArray[i].date_fix + "</td>";
		divStr += "<td class='sc-line'>";
		if (calendarsArray[i].day_type_id == 1) {
			divStr += "Праздник";
		} 
		if (calendarsArray[i].day_type_id == 2) {
			divStr += "Перенос выходного";
		} 
		if (calendarsArray[i].day_type_id == 3) {
			divStr += "Работа в выходной";		
		}
		divStr += "</td>";
		divStr += "<td class='sc-line'>" + calendarsArray[i].date_text + "</td>";
		
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Редактировать", "fa-pencil", "showEditCalendar(" + i + ")") + "</td>";
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Удалить", "fa-trash", "showDeleteCalendar(" + i + ")") + "</td></tr>";
	}	
	if (calendarsArray.length == 0) {
		divStr += "<tr><td class='sc-line sc-btn-td calendarGrey' colspan='3'>Дни отсутствуют.</td></tr>";		
	}
	divStr += "<tr><td class='sc-btn-td sc-line'>" + getTableBtnStr("Добавить", "fa-plus", "showEditCalendar(-1)") + "</td>";
	divStr += "<td class='sc-line sc-btn-td' colspan='2'></td></tr>";		
	divStr += "</table></div></div>";		
	document.getElementById("mainBodyBox").innerHTML = divStr;
	refreshTooltips("calendarBoxOuter");
	hideScreenLoader();
}

function showEditCalendar(calendarIdx) {
	let calendarDateText = "";
	let calendarDateFix = "";
	let typeVacationId = "";
	/* let isDay = 0; */
	let calendarDayType = "";
	let formTitle = "Добавление новой даты";
	if (calendarIdx != -1) {
		calendarDateText = calendarsArray[calendarIdx].date_text;
		calendarDateFix = calendarsArray[calendarIdx].date_fix;
		/* isDay = calendarsArray[calendarIdx].day_type_id; */
		calendarDayType = calendarsArray[calendarIdx].day_type_id;
		
		formTitle = "Редактирование даты " + calendarsArray[calendarIdx].date_text + " (" + calendarsArray[calendarIdx].date_fix + ")";		
	}
	
	let formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Дата</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='date' id='calendarDateFixEdit' value='";
	formStr += calendarDateFix + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Наименование</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='calendarDateTextEdit' value='";
	formStr += calendarDateText + "' /></div></div>";
	
	/* formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Праздник</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='calendarIsDay1Edit' ";
	if (isDay == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Перенос выходного</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='calendarIsDay2Edit' ";
	if (isDay == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Работа в выходной</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='calendarIsDay3Edit' ";
	if (isDay == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>"; */
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Тип дня</div>";
	formStr += "<div class='col col-8'><select class='form-select' id='DayTypeEdit'>";
	for (let i = 0; i < daysArray.length; i++) {
		formStr += "<option value='" + daysArray[i].id + "'";
		if (calendarDayType == daysArray[i].id) {
			formStr += " selected";
		}
		formStr +=" >" + daysArray[i].name + "</option>";	
	}	
	formStr += "</select></div></div>";

	showModal(formTitle, formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'onclick': 'saveCalendar(' + calendarIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Сохранить'}]);
}

function saveCalendar(calendarIdx) {
	let actionName = "addCalendar";
	let calendarDateText = document.getElementById("calendarDateTextEdit").value;
	let calendarDateFix = document.getElementById("calendarDateFixEdit").value;
	let calendarDayType = document.getElementById("DayTypeEdit").value;
	/* let isDay = "1";  */
	if (calendarIdx != -1) {
		actionName = "editCalendar";
	}
	/* if (document.getElementById("calendarIsDay1Edit").checked) {
		isDay = '1';
	}	
	if (document.getElementById("calendarIsDay2Edit").checked) {
		isDay = '2';
	}	
	if (document.getElementById("calendarIsDay3Edit").checked) {
		isDay = '3';
	}
		if (((document.getElementById("calendarIsDay1Edit").checked) && (document.getElementById("calendarIsDay2Edit").checked)) ||
		((document.getElementById("calendarIsDay1Edit").checked) && (document.getElementById("calendarIsDay3Edit").checked)) ||
		((document.getElementById("calendarIsDay2Edit").checked) && (document.getElementById("calendarIsDay3Edit").checked))) {
			alert ('Выберите только один тип дня');
		}
		else {
		sendRequest({"actionType": "admin.calendar", "actionName": actionName, "calendarDateText": calendarDateText, "calendarDateFix": calendarDateFix, "isDay": isDay})
		.then(function(jsonResponse) {
			if (jsonResponse["msgStatus"] == "success") {
				hideModal();	
				refreshAll();			
			}
			});
		} */
	sendRequest({"actionType": "admin.calendar", "actionName": actionName, "calendarDateText": calendarDateText, "calendarDateFix": calendarDateFix, "isDay": calendarDayType})
		.then(function(jsonResponse) {
			if (jsonResponse["msgStatus"] == "success") {
				hideModal();	
				refreshAll();			
			}
			});
}


function showDeleteCalendar(calendarIdx) {
	let formStr = "<div class='row m-3 justify-content-center'>Вы действительно хотите удалить день <b>";
	formStr += calendarsArray[calendarIdx].date_text + "</b> (" + calendarsArray[calendarIdx].date_fix + ")?</div>";
	showModal("Удалить день", formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'dismiss': '1', 'onclick': 'deleteCalendar(' + calendarIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Удалить'}]);	
}

function deleteCalendar(calendarIdx) {
	let calendarId = calendarsArray[calendarIdx].date_fix;
	sendRequest({"actionType": "admin.calendar", "actionName": "deleteCalendar", "calendarId": calendarId})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			refreshAll();			
		}
	});	
}
  

/* function showFilter() {
	let FilterYear = "";
	let year2023 = "2023";
	let year2022 = "2022";
	let year2021 = "2021";
	let formTitle = "Фильтр года";
	let formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Выберите год</div>";
	formStr += "<div class='col col-8'><select class='form-select' id='YearFilterEdit'>";
	formStr += "<option value='" + year2023 + "'selected>2023</option>";
	formStr += "<option value='" + year2022 + "'>2022</option>";
	formStr += "<option value='" + year2021 + "'>2021</option>";
	formStr += "</select></div></div>";

	showModal(formTitle, formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'onclick': 'refreshYear()();return false;', 'text': '<span class="fa fa-check"></span>Сохранить'}]);
} */

function showFilter() {
	let FilterYear = "";
	let formTitle = "Фильтр года";
	let formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Выберите год</div>";
	formStr += "<div class='col col-8'><select class='form-select' id='YearFilterEdit'>";
	for (let i = 0; i < filterArray.length; i++) {
		formStr += "<option value='" + filterArray[i].year + "'";
		formStr +=" >" + filterArray[i].year + "</option>";	
	}	
	formStr += "</select></div></div>";
	showModal(formTitle, formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'onclick': 'refreshYear()();return false;', 'text': '<span class="fa fa-check"></span>Сохранить'}]);
}