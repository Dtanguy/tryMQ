var coreReq = require('./tryMQ/src/core.js');
var core = new coreReq();

var config = {
	portUDP 	: 33333,
	brokerIpUDP : ['127.0.0.1', '192.168.1.17'],
	portWS 		: 8080,
	brokerIpWS 	: '127.0.0.1',
	pswrd 		: 'your_password!'
};

// Start Core
core.setup('CORE', config, coreError);

// Subscribe to all messages
core.subscribe('/CORE/all', function (msg) {
	core.log(msg);
});

// Subscribe '/TOPIC/subtopic' messages
core.subscribe('/TOPIC/subtopic', function (msg) {
	console.log(msg);
});

// In case of error
function coreError(err, code){
	if(code == 0){
		core.warn(err);
	}else{
		core.error(err);
	}
};
