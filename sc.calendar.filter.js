var calendarAllFilters = null;
var selectedFilterCode = null;

function loadAllFilters() {
	return sendRequest({"actionType": "calendar", "actionName": "getAllCalendarFilters"})
	.then(function(jsonResponse) {
	calendarAllFilters = jsonResponse;
	viewMfCalendarFilter();
	});
}

function viewMfCalendarFilter() {
	if (calendarAllFilters == null) {
		loadAllFilters();
		return;		
	}
	divStr = "<div class='list-group'>";
	for (var codeIdx in calendarAllFilters['codes']) {
		var code = calendarAllFilters['codes'][codeIdx]
		var requiredItem = "";
		if (calendarAllFilters['filters'][code]['required']) {
			requiredItem = " *";
		}
		var checkedItem = "";
		var textClassName = "hidden";
		var valueItem = "";
		if (typeof calendarFilter[code] != "undefined") {
			checkedItem = "checked";
			textClassName = "col col-auto sc-header flex-shrink-1";
			valueItem = calendarFilter[code]['value'];
		}
		var textElement = "";
		var editElement = "";
		switch (calendarAllFilters['filters'][code]['type']) {
			case "multi-select":
				if (valueItem == "") {
					valueItem = [];	
				}
				editElement = "<div class='hidden' id='" + code + "CFEditDiv'><div class='col col-auto'>";
				editElement += "<select class='form-select' id='" + code + "CFAllEdit' size='5' ondblclick='addMsItem(" + '"' + code;
				editElement += '"' + ");' onchange='changeFilter(" + '"' + code + '"' + ");'>";
				var editSelect = "<select class='form-select' id='" + code + "CFEdit' size='5' ondblclick='delMsItem(" + '"' + code;
				editSelect += '"' + ");' onchange='changeFilter(" + '"' + code + '"' + ");'>";
				var textItem = "";	
				for (var idx = 0; idx < calendarAllFilters['filters'][code]['dataset'].length; idx++) {
					dsLine = calendarAllFilters['filters'][code]['dataset'][idx];
					editElement += "<option "
					if (valueItem.indexOf(dsLine["key"]) > -1) {						
						editSelect += "<option value='" + dsLine["key"] + "'";
						if (valueItem.indexOf(dsLine["key"]) == 0) {
							editSelect += " selected";
						}
						editSelect += ">" + dsLine["name"] + "</option>";
						if (textItem != "") {
							textItem += ", ";
						}							
						textItem += dsLine["name"];
					}
					editElement += "value='" + dsLine["key"] + "'";
					if (idx == 0) {
						editElement += " selected";
					}
					editElement += ">" + dsLine["name"] + "</option>";
				}
				editSelect += "</select>";
				editElement += "</select></div><div class='col col-auto px-0'><button id='" + code + "CFBtnAdd' type='button' ";
				editElement += "class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
				editElement += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='Выбрать' ";
				editElement += "onclick='addMsItem(" + '"' + code + '"' + ");'><span class='fa fa-arrow-right'></span></button>";
				editElement += "<button id='" + code + "CFBtnDel' type='button' class='list-group-item list-group-item-action sc-btn sc-btn-square' ";
				editElement += "data-bs-toggle='tooltip' data-bs-placement='bottom' title='Удалить' ";
				editElement += "onclick='delMsItem(" + '"' + code + '"' + ");'";
				if (valueItem.length == 0) {
					editElement += " disabled";
				}				
				editElement += "><span class='fa fa-arrow-left'></span></button>";
				
				editElement += "</div><div class='col align-self-end'>" + editSelect + "</div></div>";
				textElement = "<div id='" + code + "CFTextDiv' class='" + textClassName + "'>" + textItem + "</div>";				
				break;
			case "combobox":				
				editElement = "<div class='hidden' id='" + code + "CFEditDiv'><div class='col col-auto'>";
				editElement += "<select class='form-select' id='" + code + "CFEdit' onchange='changeFilter(" + '"' + code + '"' + ");'>";
				var textItem = "";
				if (calendarAllFilters['filters'][code]['dataset'].length > 0) {
					textItem = calendarAllFilters['filters'][code]['dataset'][0]["name"];
				}
				for (var idx = 0; idx < calendarAllFilters['filters'][code]['dataset'].length; idx++) {
					dsLine = calendarAllFilters['filters'][code]['dataset'][idx];
					editElement += "<option "
					if (valueItem == dsLine["key"]) {
						editElement += "selected ";
						textItem = dsLine["name"];
					}
					editElement += "value='" + dsLine["key"] + "'>" + dsLine["name"] + "</option>";	
				}
				editElement += "</select></div></div>";
				textElement = "<div id='" + code + "CFTextDiv' class='" + textClassName + "'>" + textItem + "</div>";				
				break;
			case "checkbox":
				editElement = "";
				textElement = "<div id='" + code + "CFTextDiv' class='" + textClassName + "'>✓</div>";				
				break;	
		}		
		divStr += "<div class='list-group-item' id='" + code + "CFListItem' onclick='selectCheckBox(" + '"' + code + '"' + ");'>";
		divStr += "<div class='row d-flex flex-nowrap g-3 row-cols-lg-auto flex-start'><div class='col'>";
		divStr += "<div class='form-check'><input class='form-check-input' type='checkbox' value='' id='" + code + "CFCB' onclick='changeCheckBox(";
		divStr += '"' + code + '"' + ");' " + checkedItem + ">";
		divStr += "<label class='form-check-label' for='" + code + "CFCB'>" + calendarAllFilters['filters'][code]['name'] + requiredItem + "</label></div></div>";
		divStr += textElement + "</div>";
		divStr += editElement + "</div>";
	}	
	divStr += "</div>";
	showModal("Фильтр рабочего календаря", divStr, [{'className':'btn-secondary', 'dismiss':'1', 'text':'<span class="fa fa-close"></span>Отмена'},
	{'className':'btn-primary', 'dismiss':'1', 'onclick':'changeFilters();', 'text':'<span class="fa fa-check"></span>Применить'}]);
	refreshTooltips("bsModalForm");
}

function addMsItem(code) {
	selectedIndex = document.getElementById(code + 'CFAllEdit').selectedIndex;
	if (selectedIndex > -1) {
		itemValue = document.getElementById(code + 'CFAllEdit').value;
		if (document.querySelector("#" + code+ "CFEdit option[value='" + itemValue + "']") == null) {		
			itemText = document.getElementById(code + 'CFAllEdit').options[selectedIndex].text;
			var newItem = new Option(itemText, itemValue);
			document.getElementById(code + 'CFEdit').append(newItem);
			newItem.selected = true;
			changeFilter(code);
		}
	}	
}

function delMsItem(code) {
	selectedIndex = document.getElementById(code + 'CFEdit').selectedIndex;
	if (selectedIndex > -1) {
		document.getElementById(code + 'CFEdit').remove(selectedIndex);
		changeFilter(code);
	}
}

function changeCheckBox(code) {
	if (calendarAllFilters['filters'][code]['required']) {
		document.getElementById(code + 'CFCB').checked = true;
	}	
	if (document.getElementById(code + 'CFCB').checked) {
		document.getElementById(code + 'CFTextDiv').className = "col col-auto sc-header flex-shrink-1";		
	} else {
		document.getElementById(code + 'CFTextDiv').className = "hidden";
		document.getElementById(code + 'CFListItem').style = "";
		if ( document.getElementById(code + 'CFEditDiv') != null) {
			document.getElementById(code + 'CFEditDiv').className = "hidden";	
		}
		selectedFilterCode = null;		
	}	
}

function selectCheckBox(code) {
	if (event.target.nodeName == "OPTION") {
		return false;
	}

	if (document.getElementById(code + 'CFCB').checked) {
		if (selectedFilterCode != null) {
			document.getElementById(selectedFilterCode + 'CFListItem').style = "";
			if ( document.getElementById(selectedFilterCode + 'CFEditDiv') != null) {
				document.getElementById(selectedFilterCode + 'CFEditDiv').className = "hidden";	
			}
		}		
		document.getElementById(code + 'CFListItem').style = "background-color: rgba(0, 0, 0, 0.05);";
		if (document.getElementById(code + 'CFEditDiv') != null) {
			document.getElementById(code + 'CFEditDiv').className = "row py-1";
			if (document.getElementById(code + 'CFAllEdit') != null) {
				document.getElementById(code + 'CFEdit').style = "width: " + document.getElementById(code + 'CFAllEdit').offsetWidth + "px;";
			}				
		}
		selectedFilterCode = code;
	} 
}

function changeFilter(code) {
	var textItem = "";
	switch (calendarAllFilters['filters'][code]['type']) {
		case "multi-select":
			hideAllTooltips();
			document.getElementById(code + 'CFBtnDel').disabled = document.getElementById(code + 'CFEdit').selectedIndex == - 1;
			document.getElementById(code + 'CFBtnAdd').disabled = document.getElementById(code + 'CFAllEdit').selectedIndex == - 1;
			for (var idx = 0; idx < document.getElementById(code + 'CFEdit').options.length; idx++) {
				if (textItem != "") {
					textItem += ", ";
				}							
				textItem += document.getElementById(code + 'CFEdit').options[idx].text;
			}		
			break;	
		case "combobox":				
			var selectedIndex = document.getElementById(code + 'CFEdit').selectedIndex;
			if (selectedIndex > -1) {
				textItem = document.getElementById(code + 'CFEdit').options[selectedIndex].text;		
			}				
			break;	
	}
	document.getElementById(code + 'CFTextDiv').innerHTML = textItem;
}

function changeFilters() {
	var resultFilter = {};
	for (var codeIdx in calendarAllFilters['codes']) {
		var code = calendarAllFilters['codes'][codeIdx]
		if (document.getElementById(code + 'CFCB').checked) {
			resultFilter[code] = {};
			resultFilter[code]['name'] = calendarAllFilters['filters'][code]['name'];
			switch (calendarAllFilters['filters'][code]['type']) {
				case "multi-select":
					var textItem = "";
					var valueArray = [];
					for (var idx = 0; idx < document.getElementById(code + 'CFEdit').options.length; idx++) {
						if (textItem != "") {
							textItem += ", ";
						}							
						textItem += document.getElementById(code + 'CFEdit').options[idx].text;
						valueArray.push(Number(document.getElementById(code + 'CFEdit').options[idx].value));
					}
					if (valueArray.length > 0) {
						resultFilter[code]['value'] = valueArray;
						resultFilter[code]['text'] = textItem;
					} else {
						delete resultFilter[code];
					}						
					break;
				case "combobox":
					resultFilter[code]['value'] = document.getElementById(code + 'CFEdit').value;
					resultFilter[code]['text'] = document.getElementById(code + 'CFEdit').options[document.getElementById(code + 'CFEdit').selectedIndex].text;	
					break;
				case "checkbox":
					resultFilter[code]['value'] = true;
					resultFilter[code]['text'] = '✓';			
					break;	
			}				
		}
	}
	workCalendarIsLoad = resultFilter['year']['value'] == calendarFilter['year']['value']; 
	calendarFilter = resultFilter;	
	refreshAll();
}

