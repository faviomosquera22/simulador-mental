
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

//Function Initialization
$(document).ready(function(){
	/* Check session */
	loginData= sessionGet("loginAccount");
	if(loginData==null) {
		//redirect users to login page
		window.location.href = "../login.html";
	}
	else {
		//Get user control access range
		getResource(url, '', '', FHIRResponseType, 'showVaccineFormat');
	}
});

/*
    說明：點擊"新增"後，切換至Add.html新增子組織
*/
// document.querySelector('.Btn.Add.Practitioner').onclick = function () {
    // location.href = '../Practitioner/Add.html?id=' + id;
// }
// document.querySelector('.Btn.Add.Patient').onclick = function () {
//     location.href = '../Patient/Add.html?id=' + id;
// }
// document.querySelector('.Btn.Add.PractitionerRole').onclick = function () {
//     location.href = '../PractitionerRole/Add.html?id=' + id;
// }

function showVaccineFormat(str) {
	let field={
		code: ['diseaseType', 'vaccineDate', 'vaccineType', 'vaccineDose'],
		desc1: ['Disease Type', 'Vaccine Date', 'Vaccine Type', 'Dose'],
		desc2: ['疾病類型', '接種日期', '疫苗類型', '第n劑'],
		img: ['disease.png', 'date.png', 'inject.png', 'injectTime.png'],
		value: []
	}
	let obj= JSON.parse(str);
    let template = [];
	
	let documentIdentifier= obj.identifier.value;
    obj.entry.map((entry, i) => {
		if(entry.resource.resourceType == 'Immunization')
		{
			let targetDisease = (entry.resource.protocolApplied[0].targetDisease[0].coding[0].code) ? entry.resource.protocolApplied[0].targetDisease[0].coding[0].code : '';
			if(entry.resource.protocolApplied[0].doseNumber) 					//For FHIR Base R5
				dose= entry.resource.protocolApplied[0].doseNumber;
			else if(entry.resource.protocolApplied[0].doseNumberPositiveInt)	//For FHIR Base R4 below
				dose= entry.resource.protocolApplied[0].doseNumberPositiveInt;
			let date =(entry.resource.occurrenceDateTime) ? entry.resource.occurrenceDateTime : '';
			let vaccineType =(entry.resource.vaccineCode.coding[0].display) ? entry.resource.vaccineCode.coding[0].display : '';
			let status = (entry.resource.status) ? entry.resource.status : '';
			field.value= [targetDisease, date, vaccineType, dose];
			
			for(let i=0; i<field.code.length;i++){
				template.push(`
				<div class="media mb-5" name="${field.code[i]}">
					<div class="d-flex me-3">
						<img class="media-object rounded-circle thumb-sm" alt="64x64" src="../../assets/img/${field.img[i]}">
					</div>
					<div class="media-body">
						<div class="text-dark">${field.desc1[i]}</div>
						<div class="text-muted small">${field.desc2[i]}</div>
					</div>
					<div class="media-body" name="value">
						<div class="text-dark value">${field.value[i]}</div>
					</div>
				</div>`)
			}
		}
    })
	if(template.length==0)
	{
		template.push(`
			<div class="media mb-5">Report template is on development progress</div>
		`)
	}
	document.getElementById('List').getElementsByClassName('List-MRDetails')[0].getElementsByClassName('Bodyer')[0].getElementsByClassName('card')[0].getElementsByClassName('card-header')[0].innerHTML = documentIdentifier;
    document.getElementById('List').getElementsByClassName('List-MRDetails')[0].getElementsByClassName('Bodyer')[0].getElementsByClassName('card')[0].getElementsByClassName('card-body')[0].innerHTML += template.join('');
}