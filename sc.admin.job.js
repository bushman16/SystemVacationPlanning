var jobsArray = [];

function refreshAll() {
	showScreenLoader();
	sendRequest({"actionType": "admin.job", "actionName": "getJobs"})
	.then(function(jsonResponse) {
		jobsArray = jsonResponse["data"];
		refreshJobsTable();
	});
}

function getTableBtnStr(btnTitle, btnImg, btnOnClick) {
	let tableBtnStr = "<button type='button' class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
	tableBtnStr += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='" + btnTitle + "' ";
	tableBtnStr += "onclick='" + btnOnClick + ";return false;'><span class='fa " + btnImg + "'></span></button>";
	return tableBtnStr;
}

function refreshJobsTable() {
	divStr = "<div class='h3 alert'>Просмотр и редактирование должностей</div>";
	divStr += "<div id='calendarBoxOuter' class='calendarBoxOuter'>";
	divStr += "<div class='d-flex mx-3'><table class='sc-table'>";
	divStr += "<tr class='sc-header'><td class='sc-btn-td sc-line'>id</td>";
	divStr += "<td class='sc-btn-td sc-line'>Название</td><td class='sc-btn-td sc-line'>Название для печати</td><td class='sc-btn-td sc-line'>internal_uid</td></tr>";		
	for (let i = 0; i < jobsArray.length; i++) {
		divStr += "<tr><td class='sc-line'>" + jobsArray[i].id + "</td>";
		divStr += "<td class='sc-line'>" + jobsArray[i].name + "</td>";
		divStr += "<td class='sc-line'>" + jobsArray[i].name_for_print + "</td>";
		divStr += "<td class='sc-line'>" + jobsArray[i].internal_uid + "</td>";
		
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Редактировать", "fa-pencil", "showEditJob(" + i + ")") + "</td>";
		divStr += "<td class='sc-btn-td sc-line'>" + getTableBtnStr("Удалить", "fa-trash", "showDeleteJob(" + i + ")") + "</td></tr>";
	}	
	if (jobsArray.length == 0) {
		divStr += "<tr><td class='sc-line sc-btn-td calendarGrey' colspan='3'>Должности отсутствуют.</td></tr>";		
	}
	divStr += "<tr><td class='sc-btn-td sc-line'>" + getTableBtnStr("Добавить", "fa-plus", "showEditJob(-1)") + "</td>";
	divStr += "<td class='sc-line sc-btn-td' colspan='2'></td></tr>";		
	divStr += "</table></div></div>";		
	document.getElementById("mainBodyBox").innerHTML = divStr;
	refreshTooltips("calendarBoxOuter");
	hideScreenLoader();
}

function showEditJob(jobIdx) {
	let jobName = "";
	let jobNameForPrint = "";
	let jobInternalUid = "";
	let InternalUid = 0;
	let formTitle = "Добавление новой должности";
	if (jobIdx != -1) {
		jobName = jobsArray[jobIdx].name;
		jobNameForPrint = jobsArray[jobIdx].name_for_print;
		jobInternalUid = jobsArray[jobIdx].internal_uid;
		if (jobInternalUid == null){
			jobInternalUid = ""
			InternalUid = 1;
		}
		formTitle = "Редактирование должности " + jobsArray[jobIdx].name + " (id=" + jobsArray[jobIdx].id + ")";		
	}
	
	let formStr = "<div class='row mb-2'><div class='col col-4 calendarGrey'>Наименование</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='jobNameEdit' value='";
	formStr += jobName + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Наименование для печати</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='jobNameForPrintEdit' value='";
	formStr += jobNameForPrint + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>internal_uid</div>";
	formStr += "<div class='col col-8'><input class='form-control' type='text' id='jobInternalUidEdit' value='";
	formStr += jobInternalUid + "' /></div></div>";
	
	formStr += "<div class='row mb-2'><div class='col col-4 calendarGrey'>Оставить internal_uid не заполненной</div>";
	formStr += "<div class='col col-8'><input class='form-check-input' type='checkbox' value='' id='InternalUidEdit' ";
	if (InternalUid == 1) {
		formStr += "checked ";
	}
	formStr += "></div></div>";
	
	showModal(formTitle, formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'onclick': 'saveJob(' + jobIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Сохранить'}]);
}

function saveJob(jobIdx) {
	let actionName = "addJob";
	let jobId = null;
	if (jobIdx != -1) {
		actionName = "editJob";
		jobId = jobsArray[jobIdx].id;
	}
	let jobName = document.getElementById("jobNameEdit").value;
	let jobNameForPrint = document.getElementById("jobNameForPrintEdit").value;
	let jobInternalUid = document.getElementById("jobInternalUidEdit").value;
	let InternalUid = 0;
	if (document.getElementById("InternalUidEdit").checked) {
		jobInternalUid = null;
	}
	
	
	sendRequest({"actionType": "admin.job", "actionName": actionName, "jobId": jobId, "jobName": jobName, "jobNameForPrint": jobNameForPrint, "jobInternalUid": jobInternalUid})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			hideModal();	
			refreshAll();			
		}
	});
}

function showDeleteJob(jobIdx) {
	let formStr = "<div class='row m-3 justify-content-center'>Вы действительно хотите удалить должность <b>";
	formStr += jobsArray[jobIdx].name + "</b> (id=" + jobsArray[jobIdx].id + ")?</div>";
	showModal("Удалить должность", formStr, [{'className': 'btn-secondary', 'dismiss': '1', 'text': '<span class="fa fa-close"></span>Отмена'},
		{'className': 'btn-primary', 'dismiss': '1', 'onclick': 'deleteJob(' + jobIdx + ');return false;', 'text': '<span class="fa fa-check"></span>Удалить'}]);	
}

function deleteJob(jobIdx) {
	let jobId = jobsArray[jobIdx].id;
	sendRequest({"actionType": "admin.job", "actionName": "deleteJob", "jobId": jobId})
	.then(function(jsonResponse) {
		if (jsonResponse["msgStatus"] == "success") {
			refreshAll();			
		}
	});	
}
  

