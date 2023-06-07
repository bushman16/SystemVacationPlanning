const oneDayMs = 1000 * 60 * 60 * 24;

function formatDate(dt, isYmd=false, withYear=false) {
	if (dt == 0) return "";
	m = (1 + dt.getMonth()).toString();
	if (m.length == 1) {
		m = "0" + m;
	}
	d = dt.getDate().toString();
	if (d.length == 1) {
		d = "0" + d;
	}
	if (isYmd) {
		return dt.getFullYear() + "-" + m + "-" + d;
	} else {
		var res = d + "." + m;
		if (withYear) {
			res = res + "." + dt.getFullYear();
		}
		return res;
	}
}

function getTypeDeclinationOfNumerals(numeral) {
	p = 2;	
    if ((numeral % 10 == 1) && (numeral % 100 != 11)) {
        p = 0;
    } else if ((2 <= numeral % 10) && (numeral % 10 <= 4) && ((numeral % 100 < 10) || (numeral % 100 >= 20))) {
        p = 1;
    }
    return p;
}

function formatHolidaysCount(daysCount) {
	days = ["праздничный день", "праздничных дня", "праздничных дней"];  
	p = getTypeDeclinationOfNumerals(daysCount);
    return daysCount.toString() + " " + days[p];
}

function formatWorkDaysCount(daysCount) {
	days = ["рабочий день", "рабочих дня", "рабочих дней"];  
	p = getTypeDeclinationOfNumerals(daysCount);
    return daysCount.toString() + " " + days[p];
}

function formatCalendarDaysCount(daysCount) {
	days = ["календарный день", "календарных дня", "календарных дней"];  
	p = getTypeDeclinationOfNumerals(daysCount);
    return daysCount.toString() + " " + days[p];
}

function formatDaysCount(daysCount) {
	days = ["день", "дня", "дней"];  
	p = getTypeDeclinationOfNumerals(daysCount);
    return daysCount.toString() + " " + days[p];
}

function formatIntersectionsCount(intersectionsCount) {
	intersections = ["пересечение", "пересечения", "пересечений"];  
	p = getTypeDeclinationOfNumerals(intersectionsCount);
    return intersectionsCount.toString() + " " + intersections[p];
}

function getDateDiff(date1, date2) {
	var diffInTime = date2.getTime() - date1.getTime();
	return Math.round(diffInTime / oneDayMs);
}

var tooltipList = [];

function hideAllTooltips() {
	for (var t = 0; t < tooltipList.length; t++) {
		tooltipList[t].hide();
	}
}

function refreshTooltips(mainContainerName) {
	var mainContainer = document.getElementById(mainContainerName);
	var paramContainer = {};
	if (mainContainer != null) {
		paramContainer = {container: mainContainer};	
	}

	hideAllTooltips();

	var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
	tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl, paramContainer);
	});
}

var bsModalForm = null;

function showModal(modalFormTitle, modalFormText, buttons=null, isStatic=true, isAutoWidth=false) {
	if (document.getElementById('bsModalForm') == null) {
		var elem = document.createElement('div');
		document.body.appendChild(elem);
		divStr = "<div class='modal fade' id='bsModalForm' data-bs-keyboard='false' tabindex='-1' aria-labelledby='bsModalFormLabel' data-bs-backdrop='static' aria-hidden='true'>";
		divStr += "<div id='bsModalDiv' class='modal-dialog modal-dialog-scrollable'>";		
		divStr += "<div class='modal-content'><div class='modal-header'><h5 class='modal-title' id='bsModalFormLabel'>";
		divStr += "</h5><button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Закрыть'></button></div>";
		divStr += "<div class='modal-body' id='bsModalFormBody'></div><div class='modal-footer' id='bsModalFormFooter'></div></div></div></div>";
		elem.innerHTML = divStr;
		
		elem.addEventListener('hidden.bs.modal', function (e) { 
			refreshTooltips("calendarBoxOuter");
		});
	}
	if (isAutoWidth) {
		var contWidth = document.body.offsetWidth - 16;
		document.getElementById('bsModalDiv').style = "display:table;table-layout:fixed;max-width:" + contWidth + "px;width:fit-content;";	
	}
	document.getElementById('bsModalFormLabel').innerHTML = modalFormTitle;
	if (isStatic) {
		document.getElementById('bsModalForm').setAttribute("data-bs-backdrop", "static");
	} else {
		document.getElementById('bsModalForm').removeAttribute("data-bs-backdrop");	
	}
	document.getElementById('bsModalFormBody').innerHTML = modalFormText;
	if (buttons != null) {
		document.getElementById('bsModalFormFooter').className = "modal-footer";
		divStr = "";
		for (var i = 0; i < buttons.length; i++) {
			btn = buttons[i];  
			divStr += "<button type='button' class='btn " + btn['className'] + "'";
			if (typeof btn['dismiss'] != "undefined") {
				divStr += " data-bs-dismiss='modal'";
			}
			if (typeof btn['onclick'] != "undefined") {
				divStr += " onclick='" + btn['onclick'] + "'";
			}
			divStr += ">" + btn['text'] + "</button>";
		}
		document.getElementById('bsModalFormFooter').innerHTML = divStr;
	} else {
		document.getElementById('bsModalFormFooter').className = "hidden";
	}

	bsModalForm = new bootstrap.Modal(document.getElementById('bsModalForm'));
	bsModalForm.show();
}

function hideModal() {
	if (bsModalForm != null) {
		bsModalForm.hide();
	}
}

function showScreenLoader(loaderId='loader', loaderText='Идет обновление данных...') {
	let elem = document.getElementById(loaderId);
	if (elem == null) {
		elem = document.createElement('div');
		elem.id = loaderId;
		document.body.appendChild(elem);
		elem.innerHTML = '<div><div class="loaderSpinner"></div><div class="loaderText">' + loaderText + '</div></div>';
	}
	elem.className = 'loader';
	let loaderTextDiv = elem.querySelector('.loaderText');
	loaderTextDiv.innerHTML = loaderText;
	
}

function hideScreenLoader(loaderId='loader') {
	if (document.getElementById(loaderId) != null) {
		document.getElementById(loaderId).className = 'hidden';
	}
}

function getMenuBtnStr(onclickFnc, imgName, btnText) {
	var btnStr = '<button type="button" class="list-group-item list-group-item-action" ';
	btnStr += 'onclick="event.stopPropagation();hidePopupBox();' + onclickFnc + ';return false;">';
	btnStr += '<span class="fa ' + imgName + '"></span>' + btnText + '</button>';
	return btnStr;
}

function hidePopupBox() {
	menuDiv = document.getElementById("popupBox");
	menuDiv.className = "hidden";
}

function viewPopupBox(menuBoxText, x, y, limitX) {	
	if (menuBoxText != "") {
		menuDiv = document.getElementById("popupBox");
		menuDiv.className = "popupBox";	
		menuDiv.innerHTML = menuBoxText;
		menuDiv.style.top = y + "px";
		menuDiv.style.left = x + "px";	
		var limit = limitX - menuDiv.offsetWidth;		
		if (menuDiv.offsetLeft > limit) {
			menuDiv.style.left = limit + "px";
		}		
	}
}

function checkMsg() {
	sendRequest({"actionType": "main", "actionName": "checkMsg"});	
}

function sendRequest(requestParams) {
	return fetch("api", {method: "POST", 
	 headers: {"Cache-Control": "no-cache", "Content-Type": "application/json;charset=utf-8"},
	 body: JSON.stringify(requestParams)})
	.then(function(response) {
		return response.json();
	})
	.catch (function(error) {
		return {};
	})
	.then(function(jsonResponse) {
		if (jsonResponse != null) {
			if (typeof jsonResponse.route != "undefined") {
				document.location.replace(jsonResponse.route);
			}
			if ((typeof jsonResponse.msgStatus != "undefined") && (typeof jsonResponse.msgText != "undefined")) {
				showMsgToast(jsonResponse.msgStatus, jsonResponse.msgText); 
			}
		}
		return jsonResponse;		
	});			
}

function hideMsgToast() {
	var toastElList = [].slice.call(document.querySelectorAll('.toast'))
	var toastList = toastElList.map(function(toastEl) {
	  return new bootstrap.Toast(toastEl);
	});
	toastList.forEach(toast => toast.hide());
}

function showMsgToast(msgType, msgText) {
	hideMsgToast();
		
	div = document.createElement("div");
	className = "toast align-items-center border-0";
	switch(msgType) {
		case 'success':
			className += " bg-toast-success text-white";
			div.setAttribute("data-bs-delay", "10000");
			iconName = "fa-check-circle";
			break;
		case 'danger':
			className += " bg-toast-danger text-white";
			div.setAttribute("data-bs-autohide", "false");
			iconName = "fa-exclamation-triangle";
			break;
		case 'warning':
			className += " bg-toast-warning text-white";
			div.setAttribute("data-bs-autohide", "false");
			iconName = "fa-exclamation-circle";		
			break;
		case 'info':
			className += " bg-toast-info text-white";
			div.setAttribute("data-bs-autohide", "false");
			iconName = "fa-info-circle";		
			break;
		default:
			iconName = "";
			div.setAttribute("data-bs-autohide", "false");
	}
	div.className = className;
	div.setAttribute("id", "toast_msg");
	div.setAttribute("role", "alert");
	div.setAttribute("aria-live", "assertive");
	div.setAttribute("aria-atomic", "true");
	divTxt = '<div class="d-flex">';
	if (iconName != "") {
		divTxt += '<span class="fa ' + iconName + ' mx-4 my-auto"></span>';
	}
	divTxt += '<div class="toast-body">' + msgText + '</div><button type="button" class="btn-close btn-close-white me-2 mx-auto my-2" ';
	divTxt += 'data-bs-dismiss="toast" aria-label="Закрыть"></button></div>';
	div.innerHTML = divTxt; 
		
	div.addEventListener('hide.bs.toast', function () {
		document.getElementById("div_msg").removeChild(document.getElementById('toast_msg'));
	});	
	document.getElementById("div_msg").append(div);

	var toastElList = [].slice.call(document.querySelectorAll('.toast'))
	var toastList = toastElList.map(function(toastEl) {
	  return new bootstrap.Toast(toastEl);
	});
	toastList.forEach(toast => toast.show());
}

function logOut() {
	sendRequest({"actionType": "main", "actionName": "logout"});	
}