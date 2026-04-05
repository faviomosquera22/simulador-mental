
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
	/* Check session */
	loginData= sessionGet("loginAccount");
	if(loginData==null) {
		//redirect users to login page
		window.location.href = "../login.html";
	}
	else {
		//Get user control access range
		getResource(FHIRURL, 'PractitionerRole', '?organization=' + loginData.organization.id, FHIRResponseType, 'getPractRoleByOrganization');
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

function getPractRoleByOrganization(str) {
	let obj= JSON.parse(str);
    let template = [];

    obj.entry.map((entry, i) => {
        let practitionerRoleID = (entry.resource.id) ? entry.resource.id : '';
        let practitionerID =(entry.resource.practitioner) ? entry.resource.practitioner.reference.split('/')[1] : '';
        let organizationID =(entry.resource.organization) ? entry.resource.organization.display : '';
        let name =(entry.resource.practitioner) ? entry.resource.practitioner.display : '';
        let identifier =(entry.resource.identifier) ? entry.resource.identifier[0].value : '';
        let role= '';
			entry.resource.code.map((code, i) => {
				role+= code.coding[0].display;
			});	
			
		let phone, email;
        entry.resource.telecom.map((telecom, i) => {
			if (telecom.system == "email")
				email= telecom.value;
			else if (telecom.system == "phone")
				phone= telecom.value;
		});
		let status = (obj.active == true) ? 'Active' : 'Inactive';
		
        template.push(`
        <li class="L1 i${i + 1} ${id}">
            <div class="Num">${i + 1}</div>
            <div class="Name">${name}</div>
            <div class="Identifier">${identifier}</div>
            <div class="Role">${role}</div>
            <div class="Email">${email}</div>
            <div class="Tool">
                <ul class="L2s">
                    <li class="L2 i1">
                        <div class="${id} Btn Detail Title">查看</div>
                    </li>
                </ul>
            </div>
            <div class="Clear"></div>
        </li>`);
    })
    document.getElementById('List').getElementsByClassName('List-Practitioner')[0].getElementsByClassName('Bodyer')[0].getElementsByClassName('L1s')[0].innerHTML += template.join('');

    // document.getElementById('List').getElementsByClassName('List-Practitioner')[0].getElementsByClassName('Bodyer')[0].addEventListener('click', e => {
        // if (e.target.tagName.toUpperCase() === 'DIV') {
            // if (e.target.classList[2] === 'Detail') {
                // let id = e.target.classList[0];
                // location.href = `../Schedule/index.html?id=${id}`;
            // }
            // else if (e.target.classList[2] === 'Edit') {
                // let id = e.target.classList[0];
                // location.href = `../Practitioner/Edit.html?id=${id}`;
            // }
        // }
    // });
}