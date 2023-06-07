var citiesArray = [];

function refreshAll() {
	showScreenLoader();
	sendRequest({"actionType": "admin.city", "actionName": "getCities"})
	.then(function(jsonResponse) {
		citiesArray = jsonResponse["data"];
		refreshCitiesTable();
	});
}

function getTableBtnStr(btnTitle, btnImg, btnOnClick) {
	let tableBtnStr = "<button type='button' class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
	tableBtnStr += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='" + btnTitle + "' ";
	tableBtnStr += "onclick='" + btnOnClick + ";return false;'><span class='fa " + btnImg + "'></span></button>";
	return tableBtnStr;
}

function refreshCitiesTable() {
	divStr = "<div class='h3 alert'>Просмотр и редактирование городов</div>";
	divStr += "<div id='calendarBoxOuter' class='calendarBoxOuter'>";
	divStr += "<div class='d-flex mx-3'><table class='sc-table'>";
	divStr += "<tr class='sc-header'><td class='sc-btn-td sc-line'>id</td>";
	divStr += "<td class='sc-btn-td sc-line'>Наименование</td><td class='sc-btn-td sc-line'>Это офис?</td></tr>";		
	for (let i = 0; i < citiesArray.length; i++) {
		divStr += "<tr><td class='sc-line'>" + citiesArray[i].id + "</td>";
		divStr += "<td class='sc-line'>" + citiesArray[i].name + "</td>";
		divStr += "<td class='sc-line'>";
		if (citiesArray[i].is_office == 1) {
			divStr += "Да";
		} else {
			divStr += "Нет";		
		}
		divStr += "</td>";			
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Редактировать", "fa-pencil", "showEditCity(" + i + ")") + "</td>";
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Удалить", "fa-trash", "showDeleteCity(" + i + ")") + "</td></tr>";
	}	
	if (citiesArray.length == 0) {
		divStr += "<tr><td class='sc-line sc-btn-td calendarGrey' colspan='3'>Города отсутствуют.</td></tr>";		
	}
	divStr += "<tr><td class='sc-btn-td sc-line'>" + getTableBtnStr("Добавить", "fa-plus", "showEditCity(-1)") + "</td>";
	divStr += "<td class='sc-line sc-btn-td' colspan='2'></td></tr>";		
	divStr += "</table></div></div>";		
	document.getElementById("mainBodyBox").innerHTML = divStr;
	refreshTooltips("calendarBoxOuter");
	hideScreenLoader();
}

function showEditCity(cityIdx) {
	let cityName = "";
	let isOffice = 0;
	let formTitle = "Добавление нового города";
	if (cityIdx != -1) {
		cityName = citiesArray[cityIdx].name;
		isOffice = citiesArray[cityIdx].is_office;
		formTitle = "Редактирование города " + citiesArray[cityIdx].name + " (id=" + citiesArray[cityIdx].id + ")";		
	}
	
	let formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Наименование</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='cityNameEdit' value='";
	formStr += cityName + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Это офис?</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='cityIsOfficeEdit' ";
	if (isOffice == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";

	showModal(formTitle, formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'onclick': 'saveCity(' + cityIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Сохранить'}]);
}

function saveCity(cityIdx) {
	let actionName = "addCity";
	let cityId = null;
	if (cityIdx != -1) {
		actionName = "editCity";
		cityId = citiesArray[cityIdx].id;
	}
	let cityName = document.getElementById("cityNameEdit").value;
	let isOffice = 0;
	if (document.getElementById("cityIsOfficeEdit").checked) {
		isOffice = 1;
	}		
	sendRequest({"actionType": "admin.city", "actionName": actionName, "cityId": cityId, "cityName": cityName, "isOffice": isOffice})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			hideModal();	
			refreshAll();			
		}
	});
}

function showDeleteCity(cityIdx) {
	let formStr = "<div class='row m-3 justify-content-center'>Вы действительно хотите удалить город <b>";
	formStr += citiesArray[cityIdx].name + "</b> (id=" + citiesArray[cityIdx].id + ")?</div>";
	showModal("Удалить город", formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'dismiss': '1', 'onclick': 'deleteCity(' + cityIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Удалить'}]);	
}

function deleteCity(cityIdx) {
	let cityId = citiesArray[cityIdx].id;
	sendRequest({"actionType": "admin.city", "actionName": "deleteCity", "cityId": cityId})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			refreshAll();			
		}
	});	
}
  

