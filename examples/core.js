/************************************************ CONFIG & BASE CORE *********************************************/

var coreReq = require('../src/core.js');
var core = new coreReq();

var config = {
	portUDP 	: 33333,
	brokerIpUDP : ['127.0.0.1', '192.168.1.17'],
	portWS 		: 8080,
	brokerIpWS 	: '127.0.0.1',
	pswrd 		: 'hey!'
};
core.setup('CORE', config, coreError);


core.subscribe('/CORE/all', function (msg) {
	core.log(msg);
});

function coreError(err, code){
	if(code == 0){
		core.warn(err);
	}else{
		core.error(err);
	}
};
