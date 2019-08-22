var oriLog = console.log;
console.log = function (message) {	
	let date = new Date(Date.now());
	oriLog('\x1b[32m' , '[' , date.toTimeString().split(' ')[0] , ']' , '\x1b[36m' , " ==> " , message , '\x1b[0m');
}

var oriWarn = console.warn;
console.warn = function (message) {	
	let date = new Date(Date.now());
	oriWarn('\x1b[32m' , '[' , date.toTimeString().split(' ')[0] , ']' , '\x1b[35m' , " ==> " , message , '\x1b[0m');
}

var oriErr = console.error;
console.error = function (message) {	
	let date = new Date(Date.now());
	oriErr('\x1b[32m' , '[' , date.toTimeString().split(' ')[0] , ']' , '\x1b[31m' , " ==> " , message , '\x1b[0m');
}


function cyan(txt){
	return '\x1b[36m' + txt + '\x1b[0m';
}

function green(txt){
	return '\x1b[32m' + txt + '\x1b[0m';
}

function red(txt){
	return '\x1b[31m' + txt + '\x1b[0m';
}

function magenta(txt){
	return '\x1b[35m' + txt + '\x1b[0m';
}

module.exports.cyan = cyan;
module.exports.green = green;
module.exports.red = red;
module.exports.magenta = magenta;
