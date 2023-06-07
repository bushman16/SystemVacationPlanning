var userInfoText = "";
var userGroups = [];
var userTabIdx = 0;

function refreshEmployee() {
	showScreenLoader();
	getUserInfo(null)
	.then(function(divStr) {
		userInfoText = divStr;
		refreshUserTab();
	});
}

function refreshUserTab() {
	var userTabNames = ["Основные данные", "Рабочие группы"];
	
	divStr = "<div class='col mx-3'>";	
	divStr += "<div class='col d-flex align-items-end'><div class='nav nav-pills'>";
	for (var i = 0; i < userTabNames.length; i++) {
		divStr += "<a class='nav-link";
		if (i == userTabIdx) {
			divStr += " active";
		} else {
			divStr += "' href='' onclick='changeUserTab(" + i + ");return false;";
		}
		divStr += "'>" + userTabNames[i] + "</a>";
	}
	divStr += "</div></div></div><div id='calendarBoxOuter' class='calendarBoxOuter vh-100'></div>";	
	document.getElementById('mainBodyBox').style.minHeight = (window.innerHeight - document.getElementById("navbar").offsetHeight - 16) + "px";
	document.getElementById('mainBodyBox').style.display = "block";
	document.getElementById("mainBodyBox").innerHTML = divStr;

	switch (userTabIdx) {
		case 0: 
			divStr = "<div class='d-flex mx-3 p-3'>" + userInfoText + "</div>";	
			document.getElementById("calendarBoxOuter").innerHTML = divStr;
			break;
		case 1: 
			refreshGroups();
			break;
		case 2: 
			refreshChiefGroups();
			break;
	}
	
	refreshTooltips("calendarBoxOuter");
	hideScreenLoader();
}

function changeUserTab(tabIdx) {
  userTabIdx = tabIdx;
  refreshUserTab();
}  
  
function refreshChiefGroups() {
	divStr = "<div class='p-3'>";
	divStr += "<div class='alert'>Управление проектами и продуктами, где пользователь является руководителем</div>";	
	divStr += "</div>";	
	document.getElementById("calendarBoxOuter").innerHTML = divStr;		 
}

function refreshGroups() {	
	divStr = "<div class='p-3'>";
	if (userGroups.length > 0) {
		if (userGroups.length > 1) {
			userGroups.sort(function(obj1, obj2) {
				if (obj1.parent_group_id < obj2.parent_group_id) return -1;
				if (obj1.parent_group_id > obj2.parent_group_id) return 1;
				if ((obj1.date_end == null) && (obj2.date_end !== null)) return 1;
				if ((obj1.date_end !== null) && (obj2.date_end == null)) return -1;
				if (obj1.date_begin < obj2.date_begin) return -1;
				if (obj1.date_begin > obj2.date_begin) return 1;
				if ((obj1.date_end !== null) && (obj2.date_end !== null)) {
					if (obj1.date_end > obj2.date_end) return -1;
					if (obj1.date_end < obj2.date_end) return 1;	
				}
				return 0;
			});
		}			
		divStr += "<div class='d-flex mx-3'><table class='sc-table'>";
		groupTypeName = "";
		var curDate = new Date();
		curDate = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate());
		for (var group_idx = 0; group_idx < userGroups.length; group_idx++) {
			group = userGroups[group_idx];
			if (group['group_type_name'] !== groupTypeName) {
				groupTypeName = group['group_type_name'];
				divStr += "<tr><td colspan='3'><sub>" + groupTypeName + "</sub></td></tr>";			
			}
			var dtBegin = new Date(group['date_begin']);
			dtBegin = formatDate(new Date(dtBegin.getFullYear(), dtBegin.getMonth(), dtBegin.getDate()), false, true);
			var dtEnd = "настоящее время";
			var oldGroupClass = "";
			if (group['date_end'] !== null) {
				dtEnd = new Date(group['date_end']);
				if (dtEnd < curDate) {
					oldGroupClass = " class='calendarGrey'";
				}
				dtEnd = formatDate(new Date(dtEnd.getFullYear(), dtEnd.getMonth(), dtEnd.getDate()), false, true);	
			}
			divStr += "<tr" + oldGroupClass + "><td class='ps-4'>" + group['group_name'];
			if (group['group_chief_name'] != '-') {
				divStr += " <sub>(" + group['group_chief_name'] + ")</sub>";	
			}
			divStr += "</td><td class='px-4'>" + group['role_name'];
			if (group['is_teamlead'] == 1) {
				divStr += "<sup>TL</sup>";	
			}				
			divStr += "</td><td>c " + dtBegin + " по " + dtEnd + "</td></tr>";	
		}		
		divStr += "</table></div>";	
	} else {
		divStr += "<div class='alert alert-info'>Рабочие группы отсутствуют.</div>";	
	}		
	divStr += "</div>";	
	document.getElementById("calendarBoxOuter").innerHTML = divStr;	
}

function getUserInfo(userId) {
	return sendRequest({"actionType": "employee", "actionName": "getUserInfo", "userId": userId})
	.then(function(jsonResponse) {
		userGroups = jsonResponse['user']['groups'];
		if (typeof userGroups == "undefined") { 
			userGroups = [];
		}
		
		const user_fields = [
		  ['last_name', 'Фамилия', 0],
		  ['first_name', 'Имя', 0],
		  ['middle_name', 'Отчество', 0],
		  ['subdivision', 'Категория', 1],
		  ['chief_name', 'Руководитель', 0],
		  ['location', 'Локация', 1],
		  ['employees', '', 0]
		];
		const employee_fields = [
		  ['org_name', 'Организация'],
		  ['job_name', 'Должность']
		];
		
		divStr = '<table class="sc-table">';
		for (var user_field_idx = 0; user_field_idx < user_fields.length; user_field_idx++) {
			user_field = user_fields[user_field_idx];
			if (user_field[0] == 'employees') {
				for (var employee_idx in jsonResponse['user']['employees']) {
					for (var employee_field_idx = 0; employee_field_idx < employee_fields.length; employee_field_idx++) {
						employee_field = employee_fields[employee_field_idx];
						if (employee_field_idx == 0) {
							divStr += '<tr><td colspan="2" style="font-size:2px; height:16px;"></td></tr>';	
						}
						divStr += '<tr><td class="calendarGrey pe-3">' + employee_field[1] + '</td>';
						divStr += '<td>' + jsonResponse['user']['employees'][employee_idx][employee_field[0]] + '</td></tr>';							
					}						
				}					
			} else {
				if (user_field[2] == 1) {
					divStr += '<tr><td colspan="2" style="font-size:2px; height:16px;"></td></tr>';	
				}
				divStr += '<tr><td class="calendarGrey pe-3">' + user_field[1] + '</td>';
				divStr += '<td>' + jsonResponse['user'][user_field[0]] + '</td></tr>';
			}		
		}
		divStr += '</table>';
		return divStr;
	});
}

function viewMfUserInfo(userId) {
	getUserInfo(userId)
	.then(function(divStr) {
		mfText = '<div class="d-flex justify-content-center">' + divStr + '</div>';
		showModal("Карточка сотрудника", mfText, null, false, true);
	});
}


