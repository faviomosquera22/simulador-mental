function QueryString(name) {
    var str = location.search.substring(1).split("&");
    for (i = 0; i < str.length; i++) {
        var result = str[i].split("=");
        if (result[0] == name) return result[1];
    }
    return "";
}