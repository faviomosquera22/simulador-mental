# FHIR Patient Portal
###### tags: `fhir-project` `PatientPortal`


## Background
<img src="https://i.imgur.com/bniuoCR.png" width="550" height="500">

A Patient portal is a secure online website that gives patients convenient, 24-hour access to personal health information from anywhere with an Internet connection.

The ability to share patient medical records across providers of different organizations and locations has tremendous benefits for patients and the healthcare system. 
In this page, we describe **medical records sharing** mechanism **across provider** using **FHIR** framework that fully leverages patient participation in controlling their own private data.
* User: [How to use the Patient Portal](https://hackmd.io/lnw8mD6CTTqteqJu3ubhYA?view)
* Developer: [How to use FHIR framework for Patient Portal](https://hackmd.io/-oO9nYS7TeGgpCta9z2nNg?view)

## Purpose
* Build a portal for patient and healthcare provider
* Build a portal with a standardized certification, authorization mechanism, and securely control over various cloud services
* Connect patient's all clinical data from various hospital

## Portal Integrated Architecture
<img src="https://i.imgur.com/65k0HVg.png" width="600" height="400">

## Characteristic
* **Health care standardized format**: Using HL7 FHIR as a format to store clinical data
* **Single Sign On (SSO)**: Use 1 account to access different Healthcare service
* **Authentication mechanism**
* **Authorization mechanism**: Using Oauth JWT Mechanism 
    * Patient may authorize health care organization or practitioner, allowing them to see patient's data and otherwise
    * Check user authorization scope

## System Integration
<!-- ### EHR X Patient Portal (Chinese version) -->
<img src="https://i.imgur.com/l8K5uVS.png" width="600" height="400">

## References
* [Patient portal-CH](https://hackmd.io/3-YA4NIlSduzirHccnIq6A?view)
* [Patient-controlled sharing of medical imaging data across unaffiliated healthcare organizations](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3555338/)
* [MI-TW PreConnectathon WG-1 Scenario 3](https://mitw.dicom.org.tw/preconnectathon1.html)
* [FHIR Immunization System](https://github.com/107711119/project) 
* [FHIR Immunization](https://hackmd.io/@w7Qw2wVXT6-Smrvv3RWxEQ/S1YbQmwzY)
* [FHIR Immunization IG](https://build.fhir.org/ig/HL7/fhir-shc-vaccination-ig/)
* IBM Security mechanism
<img src="https://i.imgur.com/A7bPsaw.png" width="600" height="400">
