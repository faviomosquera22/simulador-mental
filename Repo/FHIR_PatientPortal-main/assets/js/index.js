//Langguage setting
if(web_language=="CH")
{
	pageName= "學習平台";
}
else if(web_language=="EN")
{
	pageName= "Home";
}

//Function Initialization
$(document).ready(function(){
	/* Check session */
	loginData= sessionGet("loginAccount");
	if(loginData==null) {
		//redirect users to login page
		window.location.href = "login.html";
	}
	else {
		//init page
		document.title= loginData.organization.name + " - " + pageName;
		$("#header").html(loginData.organization.name + "<br>" + pageName);
		$("#intro").html("Welcome, " + loginData.person.name + "!");
		//Get user control access range
		getResource(FHIRURL, 'Group', '/' + DB.group, FHIRResponseType, 'getRoleAccess');
		getResource(FHIRURL, 'Library', '/' + DB.library, FHIRResponseType, 'getMenuModule');
	}
});

function getRoleAccess(str){
	let obj= JSON.parse(str);
	obj.characteristic.map((role, i) => {
		//User role code e.g. doctor, hospital administrator
		let arr= loginData.role[0].roleCode;
		//Check user role access module
		if(arr.includes(role.code.coding[0].code))
		{
			role.valueCodeableConcept.coding.map((mod, i) => {
				let key= mod.code? mod.code : '';
				let value= (mod.version==1)? true : false;
				CRoleAccess[key]= value;
			});	
		}
	});
	loginData.roleAccess.push(CRoleAccess);
}

function getMenuModule(str)
{
	let obj= JSON.parse(str);
	var table= document.getElementById("TableAppointment");
	var cellIndex;
	var row, noIndex=1, videoName;
	//Menu
	obj.dataRequirement.map((menu, i) => {
		let header=false;
		//Module
		menu.codeFilter.map((module, i) => {
			let modCode= module.code[0].code;
			if(CRoleAccess.hasOwnProperty(modCode))
			{
				//Show menu title
				if(!header)
				{
					header=true;
					row = table.insertRow(-1);
					row.align="center";
					row.insertCell(0).innerHTML= menu.type;
				}
				row = table.insertRow(-1);
				row.align="left";
				let elLink = document.createElement('a');
				elLink.innerHTML = module.searchParam;
				elLink.href = (module.valueSet)? module.valueSet : module.code[0].display + '/index.html';
				row.insertCell(0).appendChild(elLink);
			}
		});
	});
}


// <!-- function linkToCourseSelection(){ -->
	// <!-- var queryParam= 'personID=' + globalPersonID; -->
	// <!-- window.open('courseSelection.html?' + queryParam, "_blank"); -->
// <!-- } -->

function logOut(){			
	 window.sessionStorage.removeItem("loginAccount");
	 window.location.href = "login.html";
}
