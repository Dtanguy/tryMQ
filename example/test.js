var modReq = require('tryMQ-client');
var mod = new modReq();

//var tryMQsetting = require('../config').tryMQ;

var setting = {
	brokerAdrr : '127.0.0.1',
	port	   : 33333
}

mod.setup('SOMENODE', setting, connected, disconnected);
function connected(){
	mod.log('Connected!');
}
function disconnected(){
	mod.log('Disonnected!');
}


setInterval(function() { 
	var msg = {
		data: 'hello !'
	};
	mod.publish('/TOPIC/subtopic', msg);
}, 1000);


mod.subscribe('/TOPIC2/subtopic2', function (msg) {
	mod.log('I receive that ! : ', msg);
});