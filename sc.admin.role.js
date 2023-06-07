var rolesArray = [];

function refreshAll() {
	showScreenLoader();
	sendRequest({"actionType": "admin.role", "actionName": "getRoles"})
	.then(function(jsonResponse) {
		rolesArray = jsonResponse["data"];
		refreshRolesTable();
	});
}

function getTableBtnStr(btnTitle, btnImg, btnOnClick) {
	let tableBtnStr = "<button type='button' class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
	tableBtnStr += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='" + btnTitle + "' ";
	tableBtnStr += "onclick='" + btnOnClick + ";return false;'><span class='fa " + btnImg + "'></span></button>";
	return tableBtnStr;
}

function refreshRolesTable() {
	divStr = "<div class='h3 alert'>Просмотр и редактирование ролей сотрудников в проектах/продуктах</div>";
	divStr += "<div id='calendarBoxOuter' class='calendarBoxOuter'>";
	divStr += "<div class='d-flex mx-3'><table class='sc-table'>";
	divStr += "<tr class='sc-header'><td class='sc-btn-td sc-line'>id</td>";
	divStr += "<td class='sc-btn-td sc-line'>Наименование</td><td class='sc-btn-td sc-line'>Аббревиатура</td><td class='sc-btn-td sc-line'>internal_uid</td></tr>";		
	for (let i = 0; i < rolesArray.length; i++) {
		divStr += "<tr><td class='sc-line'>" + rolesArray[i].id + "</td>";
		divStr += "<td class='sc-line'>" + rolesArray[i].name + "</td>";
		divStr += "<td class='sc-line'>" + rolesArray[i].short_name + "</td>";
		divStr += "<td class='sc-line'>" + rolesArray[i].internal_uid + "</td>";
					
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Редактировать", "fa-pencil", "showEditRole(" + i + ")") + "</td>";
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Удалить", "fa-trash", "showDeleteRole(" + i + ")") + "</td></tr>";
	}	
	if (rolesArray.length == 0) {
		divStr += "<tr><td class='sc-line sc-btn-td calendarGrey' colspan='3'>Роли отсутствуют.</td></tr>";		
	}
	divStr += "<tr><td class='sc-btn-td sc-line'>" + getTableBtnStr("Добавить", "fa-plus", "showEditRole(-1)") + "</td>";
	divStr += "<td class='sc-line sc-btn-td' colspan='2'></td></tr>";		
	divStr += "</table></div></div>";		
	document.getElementById("mainBodyBox").innerHTML = divStr;
	refreshTooltips("calendarBoxOuter");
	hideScreenLoader();
}

function showEditRole(roleIdx) {
	let roleName = "";
	let roleShortName = "";
	let roleInternalUid = "";
	let InternalUid = 0;
	let formTitle = "Добавление новой роли";
	if (roleIdx != -1) {
		roleName = rolesArray[roleIdx].name;
		roleShortName = rolesArray[roleIdx].short_name;
		roleInternalUid = rolesArray[roleIdx].internal_uid;
		if (roleInternalUid == null){
			roleInternalUid = ""
			InternalUid = 1;
		}
		formTitle = "Редактирование роли " + rolesArray[roleIdx].name + " (id=" + rolesArray[roleIdx].id + ")";		
	}
	
	let formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Наименование</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='roleNameEdit' value='";
	formStr += roleName + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Аббревиатура</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='roleShortNameEdit' value='";
	formStr += roleShortName + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>internal_uid</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='roleInternalUidEdit' value='";
	formStr += roleInternalUid + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Оставить internal_uid не заполненной</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='InternalUidEdit' ";
	if (InternalUid == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";

	showModal(formTitle, formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'onclick': 'saveRole(' + roleIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Сохранить'}]);
}

function saveRole(roleIdx) {
	let actionName = "addRole";
	let roleId = null;
	if (roleIdx != -1) {
		actionName = "editRole";
		roleId = rolesArray[roleIdx].id;
	}
	let roleName = document.getElementById("roleNameEdit").value;
	let roleShortName = document.getElementById("roleShortNameEdit").value;
	let roleInternalUid = document.getElementById("roleInternalUidEdit").value;
	let InternalUid = 0;
	if (document.getElementById("InternalUidEdit").checked) {
		roleInternalUid = null;
	}
	
	sendRequest({"actionType": "admin.role", "actionName": actionName, "roleId": roleId, "roleName": roleName, "roleShortName": roleShortName, "roleInternalUid": roleInternalUid})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			hideModal();	
			refreshAll();			
		}
	});
}

function showDeleteRole(roleIdx) {
	let formStr = "<div class='row m-3 justify-content-center'>Вы действительно хотите удалить роль <b>";
	formStr += rolesArray[roleIdx].name + "</b> (id=" + rolesArray[roleIdx].id + ")?</div>";
	showModal("Удалить роль", formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'dismiss': '1', 'onclick': 'deleteRole(' + roleIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Удалить'}]);	
}

function deleteRole(roleIdx) {
	let roleId = rolesArray[roleIdx].id;
	sendRequest({"actionType": "admin.role", "actionName": "deleteRole", "roleId": roleId})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			refreshAll();			
		}
	});	
}
  

