/*
    Public variable area
*/
var partOfid = '';
var web_language= "EN";
var pageName='';

let message= {
	contactPerson: "",
	signUpFail: "",
	signUpOK: "",	
	signInFail: "",
	requiredField: "",
	emailFormatWrong: "",
	accountExist: "",
	accountUnexist: "",
	passwordWrong: "",
	authorizeFail: "",
	systemError: ""
}

if(web_language=="CH")
{
	// message.contactPerson= "請聯絡" + info.universityName + " " + info.universityDept +
				   // " " + info.cpName + "<br>電話：" + info.cpPhone + "<br>郵件：" + info.cpEmail;
	message.signUpFail= "註冊失敗!";
	message.signUpOK= "註冊成功, 需等1-2分鐘才可以登入唷！";
	message.signInFail= "無法登入或忘記密碼";
	message.requiredField= "表單未填寫完畢";
	message.emailFormatWrong= "Email 格式錯誤";
	message.accountExist= "該帳號已註冊過!";
	message.accountUnexist= "帳號不存在!";
	message.passwordWrong= "密碼錯誤!";
	message.authorizeFail= "只有教師有權限!";
	message.systemError= "系統錯誤!";
}
else if(web_language=="EN")
{
	message.contactPerson='';
	message.signUpFail= "Registration failed!";
	message.signUpOK= "Registration completed, please wait 1-2 minutes for sign in！";
	message.signInFail= "Sign in failed or forget password, ";
	message.requiredField= "Required field must not be empty";
	message.emailFormatWrong= "Wrong email format";
	message.accountExist="This email has been registered!";
	message.accountUnexist= "This user account is not registered!";
	message.updatePasswordOK= "Update password completed！";
	message.updatePasswordFail ="Update password fail!";
	message.passwordWrong= "Wrong password!";
	message.authorizeFail= "Account authorization fail! Make sure you login with practitioner account of this organization";
	message.systemError= "System error!";
}

let loginData = {
	expirationDate: '',
	person:{
		id: '',
		identifier: '',
		name: '',
		username: ''
	},
	role: [],
	organization: {
		id: '',
		identifier: '',
		status: '',	
		name: '',		
		cpname: '',
		cpphone: '',
		cpemail: ''
	},
	roleAccess:[]
}
	
let CPractitioner = {
	roleName: '',
	practID: '',
	practRoleID: '',
	practRoleIdentifier: '',
	organizationID: '',
	organizationName: '',
	roleCode: []
}

let CPatient = {
	roleName: '',
	patientID: '',
	status: '',
	patientIdentifier: '',
	organizationID: '',
	organizationName: ''
}

let CRoleAccess = {}
let MR=[];

// Get Date and Time function
function getDate() {
    var today = new Date();
	var yyyy = today.getFullYear();
	var MM = (today.getMonth() + 1) >= 10 ? (today.getMonth() + 1) : ("0" + (today.getMonth() + 1));
	var dd = today.getDate() < 10 ? ("0" + today.getDate()) : today.getDate();
	return yyyy + "-" + MM + "-" + dd;
}

function checkTime(i) {
	return (i < 10) ? "0" + i : i;
}
	
function getTime() {
    var today = new Date(),
		hh = checkTime(today.getHours()),
		mm = checkTime(today.getMinutes()),
		ss = checkTime(today.getSeconds());
	return hh + ":" + mm + ":" + ss;
}


function tablePagination(id, row){
	let tableID= "#parent-" + id;
	$(tableID).after('<div id="nav" class="pagination"></div>');
	tableID+= " .child";
	var rowsShown = row;
	var rowsTotal = $(tableID).length;
	var numPages = rowsTotal/rowsShown;
	for(i = 0;i < numPages;i++) {
		var pageNum = i + 1;
		$('#nav').append('<a href="#" rel="'+i+'">'+pageNum+'</a> ');
	}
	$(tableID).hide();
	$(tableID).slice(0, rowsShown).show();
	$('#nav a:first').addClass('active');
	$('#nav a').bind('click', function(){

		$('#nav a').removeClass('active');
		$(this).addClass('active');
		var currPage = $(this).attr('rel');
		var startItem = currPage * rowsShown;
		var endItem = startItem + rowsShown;
		$(tableID).css('opacity','0.0').hide().slice(startItem, endItem).
				css('display','table-row').animate({opacity:1}, 300);
	});
}


// Generate CSV
function generateCSV(rows){
	let csvContent = "data:text/csv;charset=utf-8," 
		+ rows.map(e => e.join(",")).join("\n");
		
	var encodedUri = encodeURI(csvContent);
	window.open(encodedUri);	
}

// Data Field Validation
function checkRequiredField(fieldArr){
	var count = 0;
	var isEmpty=false, formatIsWrong= false;
	for (var k = 0; k < fieldArr.code.length; k++) {
		let obj= document.getElementById(fieldArr.code[k]);
		if(fieldArr.isRequired[k])
		{
			if (fieldArr.type[k] == "radio" && !obj.checked) {
				isEmpty=true;
				break;
			}
			if ((fieldArr.type[k] == "text" || fieldArr.type[k] == "password") && obj.value == "") { 
				isEmpty=true;
				break;
			}
			if (fieldArr.type[k] == "email") { 
				var emailFormat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
				if (obj.value == ""){
					isEmpty=true;
					break;
				}
				else if (obj.value != "" && !emailFormat.test(obj.value)){
					formatIsWrong= true;
					break;
				}
			}
		}
	}
	if (isEmpty || formatIsWrong){
		if (isEmpty) alert(message.requiredField);
		if (formatIsWrong) alert(message.emailFormatWrong);
		document.getElementById("btnSubmit").disabled = false;
		return 0;
	}
	return 1;
}

// Logout menu
function logOut(){			
	 window.sessionStorage.removeItem("loginAccount");
	 window.location.href = "../login.html";
}

// Page Loading
	$(window).on("load", function(e) {
		if($("#global-loader").length)
			$("#global-loader").fadeOut("slow");
	})