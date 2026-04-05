
/*
    說明：由網址列參數取得自身Id，當網址列中無Id，則作為查看第一層資料列表
*/
var id = (QueryString('id') == '') ? '' : QueryString('id');
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
	document.getElementById("loadingPage").style.display="block";
	/* Check session */
	loginData= sessionGet("loginAccount");
	if(loginData==null) {
		//redirect users to login page
		window.location.href = "../login.html";
	}
	else {
		//Get user control access range
		//getResource(FHIRURL, 'Patient', '?organization=' + loginData.organization.id, FHIRResponseType, 'getPractRoleByOrganization');
		getResource(FHIRURL, 'DocumentReference', '?subject=Patient/' + loginData.role[0].patientID + "&_sort=-_lastUpdated", FHIRResponseType, 'getDocReferenceByPatID');
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

function getDocReferenceByPatID(str) {
	let obj= JSON.parse(str);
    let template = [];

    obj.entry.map((entry, i) => {
        let docRefID = (entry.resource.id) ? entry.resource.id : '';
        let date =(entry.resource.date) ? entry.resource.date.split('T')[0] : '';
        let practitionerID =(entry.resource.authenticator) ? entry.resource.authenticator.reference.split('/')[1] : '';
        let organizationDesc =(entry.resource.custodian) ? entry.resource.custodian.display : '';
        if(entry.resource.content)
		{
			entry.resource.content.map((content, i) => {
				let temp={
					desc:'',
					url:''
				};
				temp.desc= content.attachment.title;
				temp.url= content.attachment.url;
				MR.push(temp);
			});
		}
		let status = (obj.status) ? obj.status : '';
		
		template.push(`
		<li class="L1 i${i + 1} ${id}">
			<div class="Num">${i + 1}</div>
			<div class="Date">${date}</div>
			<div class="MRDesc">${MR[i].desc}</div>
			<div class="OrganizationDesc">${organizationDesc}</div>
			<div class="Tool">
				<ul class="L2s">
					<li class="L2 i1">
						<div class="${MR[i].url} Btn Detail Title">Detail</div>
					</li>
				</ul>
			</div>
			<div class="Clear"></div>
		</li>`);
    })
    document.getElementById('List').getElementsByClassName('List-MedicalRecord')[0].getElementsByClassName('Bodyer')[0].getElementsByClassName('L1s')[0].innerHTML += template.join('');

    document.getElementById('List').getElementsByClassName('List-MedicalRecord')[0].getElementsByClassName('Bodyer')[0].addEventListener('click', e => {
        if (e.target.tagName.toUpperCase() === 'DIV') {
            if (e.target.classList[2] === 'Detail') {
                let url = e.target.classList[0];
                location.href = `detail.html?url=${url}`;
            }
        }
    });
	document.getElementById("loadingPage").style.display="none";
}