//Set table field
let field= {
	//field code	
	code: ["Name", "Email", "Password", "HighestEduDegree", "Institution"],
	//field placeholder	
	placeholder: ["", "", "", "e.g. Bachelor", "e.g. Harvard University"],
	//field name
	desc: [],
	//field required or not
	isRequired: [1,1,1,1,1],		
	//field type e.g. text, number, password
	type: ["text", "email", "password", "text", "text"]			
};

if(web_language=="CH")
{
	field.desc= ["姓名", "Email", "密碼", "最高學歷", "就讀機構"];
	info.pageName= "註冊網頁";
}
else if(web_language=="EN")
{
	field.desc= ["Name", "Email", "Password", "Educational Degree", "Educational/Working Institution"];
	info.pageName= "Sign Up";
}

let temp="";
//Show Registration Form field
$(document).ready(function(){
	for(let i=0; i<field.desc.length;i++){
		temp += '<tr><td>' + field.desc[i];
		if(field.isRequired[i])			
			temp += '<font color="red"> *</font>';
		
		temp += '</td><td>:</td><td>&nbsp;<input class="width250" type="' + field.type[i] + '" id="p' + field.code[i] + '" ';
		
		if(field.placeholder[i] != "")
			temp += 'placeholder="' + field.placeholder[i] + '" ';
		
		if(field.code[i] == "Password")
			temp += 'onkeyup="SHA256PWD.value = sha256(this.value);" ';
			
		if(field.isRequired[i])			
			temp += 'required';
			
		temp += '><br></td></tr>';
	}
	temp+= '<tr><td colspan="3" align="right"><input id="btnSubmit" type="button" value="Submit" onclick="dataValidation()"></td></tr>';
	document.getElementById('mainTable').innerHTML= temp;
});

//Show Page Title and Header (need to initialize info.pageName beforehand)
document.title= info.courseName + "-" + info.pageName;
document.getElementById("header").innerHTML= info.courseName + "<br>" + info.pageName;

//Initialize Fhir Person class
let user = new CPerson();
//local variable for store temporary json obj
let personJSON, slotJSON=[];

//Validate data input by user
function dataValidation(){
	if(checkRequiredField(field)){
		document.getElementById("loadingPage").style.display = "block";
		user.username= $("#pEmail").val();
		user.highestEduDegree= $("#pHighestEduDegree").val();
		user.institution= $("#pInstitution").val();
		getResource(FHIRURL, 'Person', '?identifier=' + user.username, FHIRResponseType, 'verifyUser');
	}
}

//Verify FHIR Person & Patient exist or not 
function verifyUser(str){
	let obj= JSON.parse(str);
	//if person exist -> alert "user exist"
	if (obj.total > 0)
	{			
		user.id = obj.entry[0].resource.link ? obj.entry[0].resource.link[0].target.reference : "";
		alert(message.accountExist);
		document.getElementById("loadingPage").style.display = "none";
	}
	//if person unexist -> check slot availability -> create new Person ->  create new Patient
	else 
	{
		getResource(FHIRURL, 'Slot', '?schedule=' + course1.scheduleID + "&status=free", FHIRResponseType, 'checkSlotAvailability');
	}
}

//Check slot availability 
function checkSlotAvailability(str){ 
	let obj= JSON.parse(str);
	if (obj.total == 0){
		alert("Course full slot!");
		document.getElementById("loadingPage").style.display = "none";
	}
	else{
		createPerson();
	}
}

//Create new FHIR Person
function createPerson(){
	initialize();
	let encPassword= document.getElementById('SHA256PWD').value;
	user.name= document.getElementById('pName').value;
	
	personJSONobj.identifier[0].value= user.username;
	personJSONobj.identifier[1].value= encPassword;
	personJSONobj.identifier[2].value= user.highestEduDegree;
	personJSONobj.identifier[3].value= user.institution;
	personJSONobj.name[0].text= user.name;
	personJSONobj.telecom[0].value= user.username;
	personJSONobj = JSON.stringify(personJSONobj);
	postResource(FHIRURL, 'Person', '', FHIRResponseType, "createPatient", personJSONobj);
}

//Create new FHIR Patient
function createPatient(str){
	let obj= JSON.parse(str);
	//If failed to create new Person
	if (!isError(obj.resourceType, "Error in create FHIR Person. " + message.contactPerson))
	{
		user.id= obj.id;
		personJSON= obj;
		patientJSONobj.name[0].text= user.name;
		patientJSONobj.managingOrganization.reference= course1.organizationID;
		patientJSONobj = JSON.stringify(patientJSONobj);
		postResource(FHIRURL, 'Patient', '', FHIRResponseType, "updatePerson", patientJSONobj);
	}
}

//Update FHIR Person to connect it with FHIR Patient
function updatePerson(str){
	let obj= JSON.parse(str);
	//If failed to create new Patient
	if (!isError(obj.resourceType, "Error in create FHIR Patient. " + message.contactPerson))
	{
		globalPatientID= obj.id;
		let link= '{"link":[{"target":{"reference":"Patient/' + globalPatientID + '","display": "' + user.name + '"}}]}';
		link= JSON.parse(link);
		
		if(personJSON.link == null)
		{
			mergedObject = {
			  ...personJSON,
			  ...link,
			};
		}
		personJSON = JSON.stringify(mergedObject);
		//putResource(FHIRURL, 'Person', '/' + user.id, FHIRResponseType, "signUpResult", personJSON)
		putResource(FHIRURL, 'Person', '/' + user.id, FHIRResponseType, "getAppointmentByPatientID", personJSON)
	}
}

//Check all appointment of patient by Actor.reference
function getAppointmentByPatientID(str){
	let obj= JSON.parse(str);
	//let patientID= obj.link[0].target.reference;
	if (!isError(obj.resourceType, "Error in update FHIR Person. " + message.contactPerson))
	{
		getResource(FHIRURL, 'Appointment', '?actor=' + globalPatientID, FHIRResponseType, 'getSlotByApptID');
	}
}

function getSlotByApptID(str){
	let obj= JSON.parse(str);
	//If patient doesn't have appointment -> check free Slot -> create new appointment
	if (obj.total == 0){
		for(let i=101; i<= 100+course1.totalSlotSession ; i++){
			getResource(FHIRURL, 'Slot', '?identifier=' + course1.scheduleCode + i + "&status=free&_count=102&_sort:asc=_lastUpdated", FHIRResponseType, 'createAppointment');
		}
	}
	// else{
		// for (var i=0;i<((jsonOBJ.total>10)?10:jsonOBJ.total);i++){ 
			// arrTempSlot[iAppointment] = jsonOBJ.entry[i].resource.slot[0].reference;			//slotID
			// iAppointment++;
		// }
		// globalScheduleExist=0;
		// for (var i=0;i<iAppointment;i++){ 
			// if(globalScheduleExist==1) break;
			// let urlStr= FHIRserver + arrTempSlot[i];
			// HTTPGetData(urlStr, "getSlotOfAppointment");
		// }
	// }
}

function createAppointment(str){
	let obj= JSON.parse(str);
	//Check slot availability again for certainty
	if (obj.total == 0){
		alert("Course full slot!");
		document.getElementById("loadingPage").style.display = "none";
	}
	else{
		initializeAppt();
		slotJSON.push(obj.entry[0].resource);
		appointmentJSONobj.slot[0].reference= "Slot/" + obj.entry[0].resource.id;				//slot ID
		appointmentJSONobj.participant[0].actor.reference= "Patient/" + globalPatientID;						//patient ID
		appointmentJSONobj.participant[0].actor.display= user.name;								//patient name
		appointmentJSONobj.participant[1].actor.reference= course1.practitionerRoleID;			//PractitionerRole ID
		appointmentJSONobj.participant[1].actor.display= course1.practitionerName;				//PractitionerRole name
		appointmentJSONobj = JSON.stringify(appointmentJSONobj);
		postResource(FHIRURL, 'Appointment', '', FHIRResponseType, "updateSlot", appointmentJSONobj);
	}
}

function updateSlot(str){
	let obj= JSON.parse(str);
	if (!isError(obj.resourceType, "Error in create FHIR Appointment. " + message.contactPerson))
	{
		let slotTemp= slotJSON.filter(x => x.id == obj.slot[0].reference.split("/")[1])[0];
		slotTemp.status="busy";
		let slotSTR = JSON.stringify(slotTemp);
		putResource(FHIRURL, 'Slot', '/' + slotTemp.id, FHIRResponseType, "signUpResult", slotSTR)
	}
}

function signUpResult(str){
	let obj= JSON.parse(str);
	if (!isError(obj.resourceType, message.signUpFail + message.contactPerson))
	{
		document.getElementById("loadingPage").style.display = "none";
		alert(message.signUpOK);
		window.close();
	}
}

function isError(resourceType, msg){
	if(resourceType=="OperationOutcome")
	{
		document.getElementById("loadingPage").style.display = "none";
		alert(msg);
		return 1;
	}
	else
		return 0;
}