var fs = require('fs');

module.exports = {

    zfill: zfill,
		tstamp: tstamp,
    
    genUser: genUser,
    genClass: genClass
}

function zfill(num, size) {
    var s = ''+num;
    while (s.length < size) s = "0" + s;
    return s;
}

function tstamp() {
	var date = (new Date());
	return zfill(date.getDate(),2) + '.' + zfill(date.getMonth()+1,2) +
		'.' + date.getFullYear() + '-' + zfill(date.getHours(),2) + ':' +
		date.getMinutes() + ':' + zfill(date.getSeconds(),2)
}

function genUser(name, emailOrCode, passw, role) {    // FUTURE - ok, emailOrCode is a bit funkadelic.  make more robust

  if (role == 'teacher') {
	 return JSON.stringify({
      "firstName": name,
      "lastName": "",
      "email": emailOrCode.replace(/[^\w\.\@\+]/gi, ''),
      "password": passw,
      "confirm": passw,
      "role": "instructor",
      "acceptedTerms": true,
      "newsletter": false,
      "errors": [],
      "isRegCompleted": false
    });
  }
  
  if (role == 'student') {
    return JSON.stringify({
      "username": name,
      "password": passw,
      "confirm": passw,
      
      "firstName": "glTest",
      "lastName": "Student",
      
      "role": "student",
      
      "regCode": emailOrCode,
      "errors": [],
      "isRegCompleted": false
    });
  }

}

function genClass(name, grades, gameId) {   // FUTURE - support for multi-game classes
	
    // Template for new MGO class
    return JSON.stringify({
        title:name,
        grade:grades,
        games:[{"id":gameId}]
    })
		
}