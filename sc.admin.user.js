var usersArray = [];
var citiesArray = [];
var divisionsArray = [];

function refreshAll() {
	showScreenLoader();
	sendRequest({"actionType": "admin.user", "actionName": "getDivisionName"}).then(function(jsonResponse) {
		divisionsArray = jsonResponse["division"];
	});
	sendRequest({"actionType": "admin.user", "actionName": "getCityName"}).then(function(jsonResponse) {
		citiesArray = jsonResponse["city"];
	});
	sendRequest({"actionType": "admin.user", "actionName": "getUsers"})
	.then(function(jsonResponse) {
		usersArray = jsonResponse["data"];
		refreshUsersTable();
	});
}

function getTableBtnStr(btnTitle, btnImg, btnOnClick) {
	let tableBtnStr = "<button type='button' class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
	tableBtnStr += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='" + btnTitle + "' ";
	tableBtnStr += "onclick='" + btnOnClick + ";return false;'><span class='fa " + btnImg + "'></span></button>";
	return tableBtnStr;
}

function refreshUsersTable() {
	divStr = "<div class='h3 alert'>Просмотр и редактирование пользователей/сотрудников</div>";
	divStr += "<div id='calendarBoxOuter' class='calendarBoxOuter'>";
	divStr += "<div class='d-flex mx-3'><table class='sc-table'>";
	divStr += "<tr class='sc-header'><td class='sc-btn-td sc-line'>id</td>";
	divStr += "<td class='sc-btn-td sc-line'>Логин</td><td class='sc-btn-td sc-line'>internal_uid</td><td class='sc-btn-td sc-line'>Фамилия</td><td class='sc-btn-td sc-line'>Фамилия для печати</td><td class='sc-btn-td sc-line'>Имя</td><td class='sc-btn-td sc-line'>Отчество</td><td class='sc-btn-td sc-line'>Дата создания</td><td class='sc-btn-td sc-line'>Дата закрытия</td><td class='sc-btn-td sc-line'>Пол</td><td class='sc-btn-td sc-line'>Подразделение</td><td class='sc-btn-td sc-line'>Город</td></tr>";		
	for (let i = 0; i < usersArray.length; i++) {
		divStr += "<tr><td class='sc-line'>" + usersArray[i].id + "</td>";
		divStr += "<td class='sc-line'>" + usersArray[i].login + "</td>";
		divStr += "<td class='sc-line'>" + usersArray[i].internal_uid + "</td>";
		divStr += "<td class='sc-line'>" + usersArray[i].last_name + "</td>";
		divStr += "<td class='sc-line'>" + usersArray[i].last_name_for_print + "</td>";
		divStr += "<td class='sc-line'>" + usersArray[i].first_name + "</td>";
		divStr += "<td class='sc-line'>" + usersArray[i].middle_name + "</td>";
		divStr += "<td class='sc-line'>" + usersArray[i].date_create + "</td>";
		divStr += "<td class='sc-line'>" + usersArray[i].date_close + "</td>";
		divStr += "<td class='sc-line'>";
		if (usersArray[i].is_male == 1) {
			divStr += "Мужской";
		} else {
			divStr += "Женский";		
		}
		divStr += "</td>";	
		divStr += "<td class='sc-line'>" + usersArray[i].nameDivision + "</td>";
		divStr += "<td class='sc-line'>" + usersArray[i].nameCity + "</td>";			
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Редактировать", "fa-pencil", "showEditUser(" + i + ")") + "</td>";
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Удалить", "fa-trash", "showDeleteUser(" + i + ")") + "</td></tr>";
	}	
	if (usersArray.length == 0) {
		divStr += "<tr><td class='sc-line sc-btn-td calendarGrey' colspan='3'>Сотрудники отсутствуют.</td></tr>";		
	}
	divStr += "<tr><td class='sc-btn-td sc-line'>" + getTableBtnStr("Добавить", "fa-plus", "showEditUser(-1)") + "</td>";
	divStr += "<td class='sc-line sc-btn-td' colspan='2'></td></tr>";		
	divStr += "</table></div></div>";		
	document.getElementById("mainBodyBox").innerHTML = divStr;
	refreshTooltips("calendarBoxOuter");
	hideScreenLoader();
}

function showEditUser(userIdx) {
	let userLogin = "";
	let userInternalUid = "";
	let userLastName = "";
	let userLastNameForPrint = "";
	let userFirstName = "";
	let userMiddleName = "";
	let userDateCreate = "";
	let userDateClose = "";
	let userNameDivision = "";
	let userNameCity = "";
	let isMale = 0;
	let DateClose = 0;
	let DateCreate = 0;
	let InternalUid = 0;
	let formTitle = "Добавление нового сотрудника";
	if (userIdx != -1) {
		userLogin = usersArray[userIdx].login;
		userInternalUid = usersArray[userIdx].internal_uid;
		if (userInternalUid == null){
			userInternalUid = ""
			InternalUid = 1;
		}
		userLastName = usersArray[userIdx].last_name;
		userLastNameForPrint = usersArray[userIdx].last_name_for_print;
		userFirstName = usersArray[userIdx].first_name;
		userMiddleName = usersArray[userIdx].middle_name;
		userDateCreate = usersArray[userIdx].date_create;
		if (userDateCreate == null){
			DateCreate = 1;
		}
		userDateClose = usersArray[userIdx].date_close;
		if (userDateClose == null){
			DateClose = 1;
		}
		userNameDivision = usersArray[userIdx].nameDivision;
		userNameCity = usersArray[userIdx].nameCity;
		isMale = usersArray[userIdx].is_male;
		formTitle = "Редактирование сотрудника " + usersArray[userIdx].login + " (id=" + usersArray[userIdx].id + ")";		
	}
	
	let formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Логин</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='userLoginEdit' value='";
	formStr += userLogin + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>internal_uid</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='userInternalUidEdit' value='";
	formStr += userInternalUid + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Оставить internal_uid не заполненной</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='InternalUidEdit' ";
	if (InternalUid == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Фамилия</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='userLastNameEdit' value='";
	formStr += userLastName + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Фамилия для печати</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='userLastNameForPrintEdit' value='";
	formStr += userLastNameForPrint + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Имя</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='userFirstNameEdit' value='";
	formStr += userFirstName + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Отчество</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='userMiddleNameEdit' value='";
	formStr += userMiddleName + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Дата создания</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='date' id='userDateCreateEdit' value='";
	formStr += userDateCreate + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Оставить дату создания не заполненной</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='DateCreateEdit' ";
	if (DateCreate == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Дата закрытия</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='date' id='userDateCloseEdit' value='";
	formStr += userDateClose + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Оставить дату закрытия не заполненной</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='DateCloseEdit' ";
	if (DateClose == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Подразделение</div>";
	formStr += "<div class='col col-8'><select class='form-select' id='userNameDivisionEdit'>";
	for (let i = 0; i < divisionsArray.length; i++) {
		formStr += "<option value='" + divisionsArray[i].id + "'";
		if (userNameDivision == divisionsArray[i].name) {
			formStr += " selected";
		}
		formStr +=" >" + divisionsArray[i].name + "</option>";	
	}	
	formStr += "</select></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Город</div>";
	formStr += "<div class='col col-8'><select class='form-select' id='userNameCityEdit'>";
	for (let i = 0; i < citiesArray.length; i++) {
		formStr += "<option value='" + citiesArray[i].id + "'";
		if (userNameCity == citiesArray[i].name) {
			formStr += " selected";
		}
		formStr +=" >" + citiesArray[i].name + "</option>";	
	}	
	formStr += "</select></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Пол мужской</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='userIsMaleEdit' ";
	if (isMale == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";

	showModal(formTitle, formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'onclick': 'saveUser(' + userIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Сохранить'}]);
}

function saveUser(userIdx) {
	let actionName = "addUser";
	let userId = null;
	if (userIdx != -1) {
		actionName = "editUser";
		userId = usersArray[userIdx].id;
	}
	let userLogin = document.getElementById("userLoginEdit").value;
	let userInternalUid = document.getElementById("userInternalUidEdit").value;
	let InternalUid = 0;
	if (document.getElementById("InternalUidEdit").checked) {
		userInternalUid = null;
	}
	let userLastName = document.getElementById("userLastNameEdit").value;
	let userLastNameForPrint = document.getElementById("userLastNameForPrintEdit").value;
	let userFirstName = document.getElementById("userFirstNameEdit").value;
	let userMiddleName = document.getElementById("userMiddleNameEdit").value;
	let userDateCreate = document.getElementById("userDateCreateEdit").value;
	let DateCreate = 0;
	if (document.getElementById("DateCreateEdit").checked) {
		userDateCreate = null;
	}
	let userDateClose = document.getElementById("userDateCloseEdit").value;
	let DateClose = 0;
	if (document.getElementById("DateCloseEdit").checked) {
		userDateClose = null;
	}
	let isMale = 0;
	if (document.getElementById("userIsMaleEdit").checked) {
		isMale = 1;
	}		
	let userNameDivision = document.getElementById("userNameDivisionEdit").value;
	let Division = 0;
	
	let userNameCity = document.getElementById("userNameCityEdit").value;

	let userSettingsData = null;
	sendRequest({"actionType": "admin.user", "actionName": actionName, "userId": userId, "userLogin": userLogin, "userInternalUid": userInternalUid, "userLastName": userLastName, "userLastNameForPrint": userLastNameForPrint, "userFirstName": userFirstName,  "userMiddleName": userMiddleName, "userDateCreate": userDateCreate, "userDateClose": userDateClose, "isMale": isMale, "userNameDivision": userNameDivision, "userNameCity": userNameCity, "userSettingsData": userSettingsData})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			hideModal();	
			refreshAll();			
		}
	});
}

function showDeleteUser(userIdx) {
	let formStr = "<div class='row m-3 justify-content-center'>Вы действительно хотите удалить сотрудника <b>";
	formStr += usersArray[userIdx].login + "</b> (id=" + usersArray[userIdx].id + ")?</div>";
	showModal("Удалить сотрудника", formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'dismiss': '1', 'onclick': 'deleteUser(' + userIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Удалить'}]);	
}

function deleteUser(userIdx) {
	let userId = usersArray[userIdx].id;
	sendRequest({"actionType": "admin.user", "actionName": "deleteUser", "userId": userId})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			refreshAll();			
		}
	});	
}
  

