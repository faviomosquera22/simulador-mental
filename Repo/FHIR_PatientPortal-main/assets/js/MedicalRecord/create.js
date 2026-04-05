//Set table field
let field= {
	code: ["PatientID", "MRDesc", "MRUrl"],
	desc: ["Patient Portal ID", "Document Description", "Document URL"],
	placeholder	: ["", "e.g. Vaccine Certificate", "e.g. https://tzfhir.ml/fhir/Bundle/5"],
	isRequired: [1,1,1],		
	type: ["text", "text", "text"]
};

/*
    說明：由網址列參數取得自身Id，當網址列中無Id，則作為查看第一層資料列表
*/
var url = (QueryString('url') == '') ? '' : QueryString('url');
/*
    getResource(URL, ResourceName, Parameter, ResponseType, AfterFun)
    說明：向Server取資料
    參數：
        URL：Server 路徑
        ResourceName：Resource名稱
        Parameter：向Server要求的參數
        ReponseType：要求Server 回傳的資料型態
        AfterFun：資料取得後欲執行的函式
    JavaScript檔案：getResource.js
    範例：
        取組織資料（自己）
        getResource(FHIRURL,'Practitioner','/1945606',FHIRResponseType,'showResource')
        取自組織資料（子層）
        getResource(FHIRURL,'Practitioner','?partof=1945606',FHIRResponseType,'showResource')
*/

let docRecJSON={
  resourceType: "DocumentReference",
  status: "current",
  type: {
    coding: [ {
      system: "https://build.fhir.org/valueset-doc-typecodes.html",
      code: "11503-0",
      display: "Medical records"
    } ]
  },
  subject: {
    reference: ""
  },
  date: getDate() + 'T' +  getTime(),
  authenticator: {
    reference: "PractitionerRole/",
    display: "Doctor name"
  },
  custodian: {
    reference: "Organization",
    display: "Hospital name"
  },
  content: [ {
    attachment: {
      url: "",
      title: ""
    }
  } ]
}


//Function Initialization
$(document).ready(function(){
	let temp="";
	/* Check session */
	loginData= sessionGet("loginAccount");
	if(loginData==null) {
		//redirect users to login page
		window.location.href = "../login.html";
	}
	else {
		/* Show Form field */
		for(let i=0; i<field.desc.length;i++){
			temp += '<label for="' + field.code[i] + '">' + field.desc[i];
			if(field.isRequired[i])			
				temp += '<font color="red"> *</font>';
			
			temp += '</label><br><input type="' + field.type[i] + '" id="' + field.code[i] + '" ';
			
			if(field.placeholder[i] != "")
				temp += 'placeholder="' + field.placeholder[i] + '" ';
		
			if(field.isRequired[i])			
				temp += 'required';
				
			temp += '><br>';
		}
		temp+= '<input type="button" value="Submit" onclick="validateData()">';
		document.getElementById('createMR').innerHTML= temp;
	}
});

//Validate data input by user
function validateData(){
	if(checkRequiredField(field)){
		uploadMR();
	}
}

function uploadMR(){
	document.getElementById("global-loader").style.display="block";
	let patientID= (document.getElementById('PatientID').value == '')? '' : document.getElementById('PatientID').value;
	let MRDesc= (document.getElementById('MRDesc').value == '')? '' : document.getElementById('MRDesc').value;
	let MRUrl= (document.getElementById('MRUrl').value == '')? '' : document.getElementById('MRUrl').value;
	
	//var tableParam = document.getElementById('TableMR');
	//var count = tableParam.rows.length;
	// for(var i=1;i<count;i++)
	// {
		// let desc= tableParam.rows[i].cells[0].children[0].value;
		// let url= tableParam.rows[i].cells[1].children[0].value;
		
		// docRecJSON.content[0].attachment.title= desc;
		// docRecJSON.content[0].attachment.url= url;
	// }
	
	docRecJSON.subject.reference= "Patient/" + patientID;
	docRecJSON.authenticator.reference= "PractitionerRole/" + loginData.role[0].practRoleID,
    docRecJSON.authenticator.display= loginData.person.name;
	docRecJSON.custodian.reference= "Organization/" + loginData.role[0].organizationID,
	docRecJSON.custodian.display= loginData.role[0].organizationName;
	docRecJSON.content[0].attachment.title= MRDesc;
	docRecJSON.content[0].attachment.url= MRUrl;
		
	postResource(FHIRURL, 'DocumentReference', '', FHIRResponseType, "uploadedResult", JSON.stringify(docRecJSON));
}

function uploadedResult(str){
	document.getElementById("global-loader").style.display="none";
	let obj= JSON.parse(str);
	let retVal= retValue(obj);
	if(retVal==0) alert('Error!');
	else alert('Finished!\nFHIR Resource ID: ' + retVal);
	
	document.getElementById("createMR").reset();
}