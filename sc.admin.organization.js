var organizationsArray = [];

function refreshAll() {
	showScreenLoader();
	sendRequest({"actionType": "admin.organization", "actionName": "getOrganizations"})
	.then(function(jsonResponse) {
		organizationsArray = jsonResponse["data"];
		refreshOrganizationsTable();
	});
}

function getTableBtnStr(btnTitle, btnImg, btnOnClick) {
	let tableBtnStr = "<button type='button' class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
	tableBtnStr += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='" + btnTitle + "' ";
	tableBtnStr += "onclick='" + btnOnClick + ";return false;'><span class='fa " + btnImg + "'></span></button>";
	return tableBtnStr;
}

function refreshOrganizationsTable() {
	divStr = "<div class='h3 alert'>Просмотр и редактирование организаций</div>";
	divStr += "<div id='calendarBoxOuter' class='calendarBoxOuter'>";
	divStr += "<div class='d-flex mx-3'><table class='sc-table'>";
	divStr += "<tr class='sc-header'><td class='sc-btn-td sc-line'>id</td>";
	divStr += "<td class='sc-btn-td sc-line'>Наименование</td><td class='sc-btn-td sc-line'>Аббревиатура</td><td class='sc-btn-td sc-line'>Указание</td><td class='sc-btn-td sc-line'>internal_uid</td></tr>";		
	for (let i = 0; i < organizationsArray.length; i++) {
		divStr += "<tr><td class='sc-line'>" + organizationsArray[i].id + "</td>";
		divStr += "<td class='sc-line'>" + organizationsArray[i].name + "</td>";
		divStr += "<td class='sc-line'>" + organizationsArray[i].short_name + "</td>";
		divStr += "<td class='sc-line'>" + organizationsArray[i].text_for_print + "</td>";
		divStr += "<td class='sc-line'>" + organizationsArray[i].internal_uid + "</td>";		
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Редактировать", "fa-pencil", "showEditOrganization(" + i + ")") + "</td>";
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Удалить", "fa-trash", "showDeleteOrganization(" + i + ")") + "</td></tr>";
	}	
	if (organizationsArray.length == 0) {
		divStr += "<tr><td class='sc-line sc-btn-td calendarGrey' colspan='3'>Организации отсутствуют.</td></tr>";		
	}
	divStr += "<tr><td class='sc-btn-td sc-line'>" + getTableBtnStr("Добавить", "fa-plus", "showEditOrganization(-1)") + "</td>";
	divStr += "<td class='sc-line sc-btn-td' colspan='2'></td></tr>";		
	divStr += "</table></div></div>";		
	document.getElementById("mainBodyBox").innerHTML = divStr;
	refreshTooltips("calendarBoxOuter");
	hideScreenLoader();
}

function showEditOrganization(organizationIdx) {
	let organizationName = "";
	let organizationShortName = "";
	let organizationTextForPrint = "";
	let organizationInternalUid = "";
	let InternalUid = 0;
	let formTitle = "Добавление новой организации";
	if (organizationIdx != -1) {
		organizationName = organizationsArray[organizationIdx].name;
		organizationShortName = organizationsArray[organizationIdx].short_name;
		organizationTextForPrint = organizationsArray[organizationIdx].text_for_print;
		organizationInternalUid = organizationsArray[organizationIdx].internal_uid;
		if (organizationInternalUid == null){
			organizationInternalUid = ""
			InternalUid = 1;
		}
		formTitle = "Редактирование организации " + organizationsArray[organizationIdx].name + " (id=" + organizationsArray[organizationIdx].id + ")";		
	}
	
	let formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Наименование</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='organizationNameEdit' value='";
	formStr += organizationName + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Аббревиатура</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='organizationShortNameEdit' value='";
	formStr += organizationShortName + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Указание</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='organizationTextForPrintEdit' value='";
	formStr += organizationTextForPrint + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>internal_uid</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='organizationInternalUidEdit' value='";
	formStr += organizationInternalUid + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Оставить internal_uid не заполненной</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='InternalUidEdit' ";
	if (InternalUid == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";

	showModal(formTitle, formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'onclick': 'saveOrganization(' + organizationIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Сохранить'}]);
}

function saveOrganization(organizationIdx) {
	let actionName = "addOrganization";
	let organizationId = null;
	if (organizationIdx != -1) {
		actionName = "editOrganization";
		organizationId = organizationsArray[organizationIdx].id;
	}
	let organizationName = document.getElementById("organizationNameEdit").value;
	let organizationShortName = document.getElementById("organizationShortNameEdit").value;
	let organizationTextForPrint = document.getElementById("organizationTextForPrintEdit").value;
	let organizationInternalUid = document.getElementById("organizationInternalUidEdit").value;
	let InternalUid = 0;
	if (document.getElementById("InternalUidEdit").checked) {
		organizationInternalUid = null;
	}
			
	sendRequest({"actionType": "admin.organization", "actionName": actionName, "organizationId": organizationId, "organizationName": organizationName, "organizationShortName": organizationShortName, "organizationTextForPrint": organizationTextForPrint, "organizationInternalUid": organizationInternalUid})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			hideModal();	
			refreshAll();			
		}
	});
}

function showDeleteOrganization(organizationIdx) {
	let formStr = "<div class='row m-3 justify-content-center'>Вы действительно хотите удалить организацию? <b>";
	formStr += organizationsArray[organizationIdx].name + "</b> (id=" + organizationsArray[organizationIdx].id + ")?</div>";
	showModal("Удалить организацию", formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'dismiss': '1', 'onclick': 'deleteOrganization(' + organizationIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Удалить'}]);	
}

function deleteOrganization(organizationIdx) {
	let organizationId = organizationsArray[organizationIdx].id;
	sendRequest({"actionType": "admin.organization", "actionName": "deleteOrganization", "organizationId": organizationId})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			refreshAll();			
		}
	});	
}
  

