const gender = {"": "", null: "", "m": "Мужской", "w": "Женский"};
var internalDictionaries = {"companies": {"name": "Компании", "fieldName": "companyCode", "resultText": "компания с аббревиатурой", "data": {}, "checkResults": []}, 
							"subdivisions": {"name": "Отделы", "fieldName": "subdivisionCode", "resultText": "отдел с аббревиатурой", "data": {}, "checkResults": []}, 
							"posts": {"name": "Должности", "fieldName": "jobName", "resultText": "должность с названием", "data": {}, "checkResults": []}};
var employees = [];
var loadingData = {"totalEmployees": 0, "EmployeeIdx": 0};
			

function setLoadingText(txt) {
	showScreenLoader('loader', txt);
}

function refreshDictionary(dictionaryName) {
	getInternalDictionaries(dictionaryName);
}

function refreshEmployeeInfo(employeeIdx) {
	checkEmployees(employeeIdx);
}

function checkActualizationDictionaries() {
	let allCheckResultsCount = 0;
	for (let internalDictionaryName in internalDictionaries) {
		allCheckResultsCount += internalDictionaries[internalDictionaryName]["checkResults"].length;
	}
	return allCheckResultsCount == 0;
}

function viewDictionary(dictionaryName) {
	let internalDictionary = internalDictionaries[dictionaryName];
	let	divStr = "";
	let alertType = "warning";
	for (let checkResult of internalDictionary["checkResults"]) {		
		divStr += "<tr><td class='sc-header sc-line'>В Internal отсутствует " + internalDictionary["resultText"] + " ";
		divStr += checkResult + "</td><td class='sc-btn-td sc-line'>";
		divStr += "<button type='button' class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
		divStr += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='Добавить в Internal' ";
		divStr += "onclick='addToDictionary(" + '"' + dictionaryName + '", "' + checkResult + '"';
		divStr += ");return false;'><span class='fa fa-cloud-download'></span></button></td></tr>";
	}
	if (divStr == "") {
		divStr = "<div class='ps-1'>корректировки не требуются</div>";
		alertType = "success";
	} else {
		divStr = "<table class='sc-table'>" + divStr + "</table>";	
	}
	let refreshBtnText = "<button type='button' class='list-group-item-action sc-btn sc-btn-square float-end' ";
	refreshBtnText += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='Обновить справочник из Internal' ";
	refreshBtnText += "onclick='refreshDictionary(" + '"' + dictionaryName + '"' + ");return false;'>";
	refreshBtnText += "<span class='fa fa-refresh'></span></button>";
	divStr = "<b>" + internalDictionary["name"] + "</b>" + refreshBtnText + divStr;
	document.getElementById(dictionaryName + "Div").innerHTML = divStr;
	document.getElementById(dictionaryName + "Div").className = "alert alert-" + alertType;	
}

function viewEmployee(employeeIdx) {
	let alertType = "danger";
	let employee = employees[employeeIdx];
	let internalUser = employee["internalUser"];
	if (employee["status"] == "ACTIVE") {
		alertType = "success";
		if (internalUser["lastName"] !== employee["lastName"]) {
			employee["checkResults"].push({"name": "Фамилия", "fieldName": "lastName", "oldText": trimStrAll(internalUser["lastName"]), 
										   "newText": employee["lastName"], "newValue": employee["lastName"]}); 					
		}
		if (internalUser["firstName"] !== employee["firstName"]) {
			employee["checkResults"].push({"name": "Имя", "fieldName": "firstName", "oldText": trimStrAll(internalUser["firstName"]), 
										   "newText": employee["firstName"], "newValue": employee["firstName"]}); 					
		}
		if (internalUser["middleName"] !== employee["middleName"]) {
			employee["checkResults"].push({"name": "Отчество", "fieldName": "middleName", "oldText": trimStrAll(internalUser["middleName"]), 
										   "newText": employee["middleName"], "newValue": employee["middleName"]}); 								
		}
		if (internalUser["sex"] !== employee["sex"]) {
			employee["checkResults"].push({"name": "Пол", "fieldName": "sex", "oldText": gender[internalUser["sex"]], 
										   "newText": gender[employee["sex"]], "newValue": employee["sex"]}); 							
		}
		if (internalUser["birthDate"] !== employee["birthDate"]) {
			employee["checkResults"].push({"name": "Дата рождения", "fieldName": "birthDate", "oldText": internalUser["birthDate"], 
										   "newText": employee["birthDate"], "newValue": employee["birthDate"]}); 							
		}
		if (internalUser["company"] !== internalDictionaries["companies"]["data"][employee["companyCode"]]) {
			let companyCode = internalUser["company"];
			for (let company in internalDictionaries["companies"]["data"]) {
				if (internalDictionaries["companies"]["data"][company] == companyCode) {
					companyCode = company;
					break;
				}
			}
			employee["checkResults"].push({"name": "Компания", "fieldName": "company", "oldText": companyCode, "newText": employee["companyCode"], 
										   "newValue": internalDictionaries["companies"]["data"][employee["companyCode"]]});			
		}
		if (internalUser["subdivision"] !== internalDictionaries["subdivisions"]["data"][employee["subdivisionCode"]]) {
			let subdivisionCode = internalUser["subdivision"];
			for (let subdivision in internalDictionaries["subdivisions"]["data"]) {
				if (internalDictionaries["subdivisions"]["data"][subdivision] == subdivisionCode) {
					subdivisionCode = subdivision;
					break;
				}
			}
			employee["checkResults"].push({"name": "Отдел", "fieldName": "subdivision", "oldText": subdivisionCode, "newText": employee["subdivisionCode"], 
										   "newValue": internalDictionaries["subdivisions"]["data"][employee["subdivisionCode"]]});						
		}			
		if (internalUser["post"] !== internalDictionaries["posts"]["data"][employee["jobName"]]) {
			let jobName = internalUser["post"];
			for (let job in internalDictionaries["posts"]["data"]) {
				if (internalDictionaries["posts"]["data"][job] == jobName) {
					jobName = job;
					break;
				}
			}
			employee["checkResults"].push({"name": "Должность", "fieldName": "post", "oldText": jobName, "newText": employee["jobName"], 
										   "newValue": internalDictionaries["posts"]["data"][employee["jobName"]]});						
		}
		if (internalUser["dateFrom"] !== employee["dateBegin"]) {
			employee["checkResults"].push({"name": "Дата трудоустройства", "fieldName": "dateFrom", "oldText": internalUser["dateFrom"], 
										   "newText": employee["dateBegin"], "newValue": employee["dateBegin"]}); 							
		}
		let contacts = {"phone": {"oldValue": null, "newValue": employee["phone"], "id": null},
						"email": {"oldValue": null, "newValue": employee["email"], "id": null}};
		for (let contact of internalUser["contacts"]) {
			if (Object.keys(contacts).indexOf(contact["type"]) !== -1) {
				contacts[contact["type"]]["oldValue"] = contact["value"];
				contacts[contact["type"]]["id"] = contact["id"];
			}
		}			
		if ((contacts["phone"]["newValue"] !== "") && (contacts["phone"]["oldValue"] !== contacts["phone"]["newValue"])) {
			employee["checkResults"].push({"name": "Телефон", "fieldType": "phone", "id": contacts["phone"]["id"], "oldText": contacts["phone"]["oldValue"], 
										   "newText": contacts["phone"]["newValue"], "newValue": contacts["phone"]["newValue"]}); 
		}		
		if ((contacts["email"]["newValue"] !== "") && (contacts["email"]["oldValue"] !== contacts["email"]["newValue"])) {
			employee["checkResults"].push({"name": "E-mail", "fieldType": "email", "id": contacts["email"]["id"], "oldText": contacts["email"]["oldValue"], 
										   "newText": contacts["email"]["newValue"], "newValue": contacts["email"]["newValue"]}); 
		}

		if (employee["checkResults"].length > 0) {
			alertType = "warning";
		}
	}
	
	let statusIcon = "fa-question-circle";
	let changeBtnText = "";
	let refreshBtnText = "";
	switch (employee["status"]) {
		case "ACTIVE":
			statusIcon = "fa-check-circle";
			if (employee["checkResults"].length > 0) {
				statusIcon = "fa-arrow-circle-right";
				changeBtnText = "<button type='button' class='list-group-item-action sc-btn sc-btn-rect' ";
				changeBtnText += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='Исправить информацию о сотруднике в Internal' ";
				changeBtnText += "onclick='changeEmployeeInfo(" + employeeIdx + ");return false;'>";
				changeBtnText += "<span class='fa fa-cloud-download'></span> Исправить</button>";
			}				
			refreshBtnText = "<button type='button' class='list-group-item-action sc-btn sc-btn-square float-end' ";
			refreshBtnText += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='Обновить информацию о сотруднике из Internal' ";
			refreshBtnText += "onclick='refreshEmployeeInfo(" + employeeIdx + ");return false;'>";
			refreshBtnText += "<span class='fa fa-refresh'></span></button>";
			break;
		case "ERROR":
			statusIcon = "fa-warning";
			break;
		case "NO_EMAIL":
			statusIcon = "fa-exclamation-circle";
			break;
		case "DELETED":
			statusIcon = "fa-minus-circle";
			break;
		case "BLOCKED":
			statusIcon = "fa-times-circle";
			break;					
	}
	
	employeeStr = "";
	for (let checkResult of employee["checkResults"]) {
		if (employee["status"] == "ACTIVE") {
			employeeStr += "<li>" + checkResult["name"] + ": «" + checkResult["oldText"] + "» ➔ «" + checkResult["newText"] + "»</li>";	
		} else {
			employeeStr += "<li>" + checkResult + "</li>";		
		}
	}
	if (employeeStr !== "") {
		employeeStr = "<ul>" + employeeStr + "</ul>";		
	}
	employeeStr = " (строка " + employee["lineNum"] + ")" + refreshBtnText +"</div>" + employeeStr + changeBtnText;
	employeeStr = "<div class='nowrap'><span class='fs-5 pe-1 fa " + statusIcon + "'></span><b>" + employee["name"] + "</b>" + employeeStr;		
	document.getElementById("user" + employeeIdx + "Div").innerHTML = employeeStr;
	document.getElementById("user" + employeeIdx + "Div").className = "alert alert-" + alertType;	
}

function viewEmployees(idx=null) {
	if (idx == null) {
		let	tblEmployeesStr = "<b>Сотрудники</b><br><br>";	
		if (checkActualizationDictionaries()) {
			for (let idxEmployee=0; idxEmployee<employees.length; idxEmployee+=1) {
				tblEmployeesStr += "<div class='alert alert-info' id='user" + idxEmployee + "Div'><b>";
				tblEmployeesStr += employees[idxEmployee]["name"] + "</b>";
				tblEmployeesStr += "<div class='ps-1'>идёт актуализация сотрудника</div></div>";
			}
		} else {
			tblEmployeesStr += "<div class='alert alert-info'>актуализация сотрудников возможна только после актуализации всех справочников</div>";	
		}			
		document.getElementById("employeesDiv").innerHTML = tblEmployeesStr;
		document.getElementById("employeesDiv").className = "calendarBoxOuter p-3";	
		
		if (checkActualizationDictionaries()) {
			for (let idxEmployee=0; idxEmployee<employees.length; idxEmployee+=1) {
				viewEmployee(idxEmployee);
			}			
		}
	} else {
		viewEmployee(idx);
	}
	refreshTooltips("mainBodyBox");
	hideScreenLoader('loader');	
}

function trimStrAll(txt) {
	let resultTxt = txt || "";
	resultTxt = resultTxt.trim();
	resultTxt = resultTxt.replace(/\s+/g," ");
	return resultTxt;
}

function loadAll() {
	let fileDict = document.getElementById('fileDict').files[0]; 
	let fileEmpl = document.getElementById('fileEmpl').files[0]; 
	if (fileDict == null) {
		showMsgToast("danger", "Выберите файл справочника телефонов/e-mail!");
		return;
	}
	if (fileEmpl == null) {
		showMsgToast("danger", "Выберите файл списка сотрудников!");
		return;
	}
	  
	loadingData["totalEmployees"] = 0;
	loadingData["employeeIdx"] = 0; 
	setLoadingText("Получение данных из Internal");
	let divStr = "";
	for (let internalDictionaryName in internalDictionaries) {
		divStr += "<div class='alert alert-info' id='" + internalDictionaryName + "Div'><b>";
		divStr += internalDictionaries[internalDictionaryName]["name"] + "</b>";
		divStr += "<div class='ps-1'>идёт актуализация справочника</div></div>";
	}
	document.getElementById("dictionariesDiv").innerHTML = divStr;
	document.getElementById("dictionariesDiv").className = "calendarBoxOuter p-3";	
	document.getElementById("employeesDiv").innerHTML = "<b>Сотрудники</b><div class='ps-1'>идёт актуализация сотрудников</div>";
	document.getElementById("employeesDiv").className = "calendarBoxOuter p-3";	
	getInternalDictionaries();
}

function getRequest(url) {
	return sendRequest({"actionType": "internal", "actionName": url, "actionParams": null})	
	.then(function(jsonResponse) {
		return jsonResponse;		
	});			
}

function getDictionaryRequest(dictionaryName) {
	return getRequest(dictionaryName)
	.then(function(jsonResponse) {
		let dictMap = internalDictionaries[dictionaryName]["data"];
		let keyFieldName = "shortName";
		if (dictionaryName == "posts") {
			keyFieldName = "name";
		}
		for (let line of jsonResponse) {
			let key = trimStrAll(line[keyFieldName]);
			if (key !== "") {
				dictMap[key] = line["id"];
			}
		}
		return jsonResponse;		
	});
}

function getInternalDictionaries(dictionaryName=null) {
	setLoadingText("Получение справочников");
	let promises = [];
	for (let internalDictionaryName in internalDictionaries) {
		if ((dictionaryName == null) || (dictionaryName == internalDictionaryName)) {
			internalDictionaries[internalDictionaryName]["data"] = {};
			internalDictionaries[internalDictionaryName]["checkResults"] = [];
			promises.push(getDictionaryRequest(internalDictionaryName));
		}
	}

	Promise.all(promises) 
	.then(results => {
		for (let idxEmployee=0; idxEmployee<employees.length; idxEmployee++) {
			for (let internalDictionaryName in internalDictionaries) {
				if ((dictionaryName == null) || (dictionaryName == internalDictionaryName)) {
					let internalDictionary = internalDictionaries[internalDictionaryName];
					if (internalDictionary["data"][employees[idxEmployee][internalDictionary["fieldName"]]] === undefined) {
						let checkTxt = employees[idxEmployee][internalDictionary["fieldName"]];
						if (internalDictionary["checkResults"].indexOf(checkTxt) == -1) {
							internalDictionary["checkResults"].push(checkTxt);
						}		
					}
				}
			}	
		}
		for (let internalDictionaryName in internalDictionaries) {
			if ((dictionaryName == null) || (dictionaryName == internalDictionaryName)) {
				viewDictionary(internalDictionaryName);
			}
		}		
		getInternalEmployees();
	});
}

function getInternalEmployees() {
	if (checkActualizationDictionaries()) {
		return getRequest("users")
		.then(function(jsonResponse) {
			let jsonUsers = jsonResponse["users"];
			if (jsonUsers != null) {
				loadingData["employeeIdx"] = 0;
				loadingData["totalEmployees"] = 0;
				let users = {};
				for (let userIdx = 0; userIdx < jsonUsers.length; userIdx++) {
					jsonUser = jsonUsers[userIdx];
					users[jsonUser["email"]] = {"id": jsonUser["id"], "removed": jsonUser["removed"]};	
				}
				for (let idxEmployee=0; idxEmployee<employees.length; idxEmployee++) {
					if (employees[idxEmployee]["email"] == "") {
						employees[idxEmployee]["checkResults"].push("У сотрудника не определен e-mail");
						employees[idxEmployee]["status"] = "NO_EMAIL";				
					} else {
						let internalUser = users[employees[idxEmployee]["email"]];
						if (internalUser === undefined) {
							employees[idxEmployee]["checkResults"].push("Сотрудник c e-mail «" + employees[idxEmployee]["email"] + "» отсутствует в Internal");
							employees[idxEmployee]["status"] = "DELETED";
						} else {
							employees[idxEmployee]["internalUser"] = internalUser;
							if (internalUser["removed"]) {
								employees[idxEmployee]["checkResults"].push("У сотрудника заблокирована учетная запись в Internal (" + employees[idxEmployee]["email"] + ")");
								employees[idxEmployee]["status"] = "BLOCKED";
							} else {
								employees[idxEmployee]["status"] = "ACTIVE";
								employees[idxEmployee]["id"] = internalUser["id"];
								loadingData["totalEmployees"] ++;										
							}
						}						
					}
				}
				checkEmployees();			
			}
		});
	} else {
		viewEmployees();
	}
}

function getUserRequest(id) {
	return getRequest("users/" + id)
	.then(function(jsonResponse) {
		loadingData["employeeIdx"] ++;
		setLoadingText("Получение информации о сотрудниках: " + loadingData["employeeIdx"] + " из " + loadingData["totalEmployees"]);  
		return jsonResponse;		
	});
}

function checkEmployees(idx=null) {
	setLoadingText("Получение информации о сотрудниках");  
	let promises = [];
	for (let idxEmployee=0; idxEmployee<employees.length; idxEmployee++) {
		if ((idx == null) || (idx == idxEmployee)) {
			if (employees[idxEmployee]["status"] == "ACTIVE") {
				employees[idxEmployee]["status"] = "ERROR";
				employees[idxEmployee]["checkResults"] = [];
				promises.push(getUserRequest(employees[idxEmployee]["internalUser"]["id"]));
			}
		}		
	}

	Promise.all(promises) 
	.then(results => {		
		for (let idxEmployee=0; idxEmployee<employees.length; idxEmployee++) {
			if ((idx == null) || (idx == idxEmployee)) {
				if (employees[idxEmployee]["status"] == "ERROR") {
					for (let result of results) {
						if (result !== null) {
							if (employees[idxEmployee]["id"] == result["user"]["id"]) {
								let jsonUser = result["user"];
								employees[idxEmployee]["internalUser"] = result["user"];
								employees[idxEmployee]["status"] = "ACTIVE";
								break;
							}
						}					
					}
				}
			}			
		}
		viewEmployees(idx);
	});
}

