const gender = {"": "", null: "", "m": "Мужской", "w": "Женский"};
var internalDictionaries = {"companies": {"name": "Компании", "fieldName": "companyCode", "resultText": "компания с аббревиатурой", "data": {}, "checkResults": []}, 
							"posts": {"name": "Должности", "fieldName": "jobName", "resultText": "должность с названием", "data": {}, "checkResults": []}};
var employees = [];
var loadingData = {"totalEmployees": 0, "EmployeeIdx": 0};

function setLoadingText(txt) {
	showScreenLoader('loader', txt);
}

function trimStrAll(txt) {
	let resultTxt = txt || "";
	resultTxt = resultTxt.trim();
	resultTxt = resultTxt.replace(/\s+/g," ");
	return resultTxt;
}

function getInternalRequest(url) {
	return sendRequest({"actionType": "internal", "actionName": url, "actionParams": null})	
	.then(function(jsonResponse) {
		return jsonResponse;		
	});			
}

function loadAll() {  
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

function getDictionaryRequest(dictionaryName) {
	return getInternalRequest(dictionaryName)
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
		for (let internalDictionaryName in internalDictionaries) {
			if ((dictionaryName == null) || (dictionaryName == internalDictionaryName)) {
				viewDictionary(internalDictionaryName);
			}
		}		
		//getInternalEmployees();
		refreshTooltips("mainBodyBox");
		hideScreenLoader('loader');	
	});
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


			


