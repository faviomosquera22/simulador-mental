// get from session (if the value expired it is destroyed)
function sessionGet(key) {
	let stringValue = window.sessionStorage.getItem(key)
    if (stringValue != null) {
		let value = JSON.parse(stringValue);
        let expirationDate = new Date(value.expirationDate);
        if (expirationDate > new Date()) {
			return value;
        } 
		else {
			window.sessionStorage.removeItem(key);
        }
    }
    return null;
}

// add into session
function sessionSet(key, value, expirationInMin) {
	//Set expired time
	if (expirationInMin>0)
	{
		let expirationDate = new Date(new Date().getTime() + (60000 * expirationInMin));
		value.expirationDate= expirationDate.toISOString();
	}
	window.sessionStorage.setItem(key, JSON.stringify(value));
}