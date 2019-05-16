var tryMQReq = require('../src/mod.js');
var tryMQ = new tryMQReq();

var config = {
	port 		: 33333,
	brokerIp 	: '127.0.0.1',
	pswrd 		: ''
};

tryMQ.setup('READER', config.cli, connected, disconnected);

function connected(adrr){
	tryMQ.log('Ready :D');
}

function disconnected(){
	tryMQ.log('Disonnected!');
}

tryMQ.subscribe('/CORE/all', function (msg) {
	console.log('///////////////////////////////////////////');
	console.warn(msg.topic);
	console.log(msg); 
});