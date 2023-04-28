//var dgram = require('dgram');
const clientUDP = require('./clientUDP.js');
const clientWS = require('./clientWS.js');
const common = require('../common.js');

var setting = {};
var set = false;
var client;
var coCb, msCb, decoCb, errCb;
var autoRecoTimeOut = 2000;
var token = -1;
var lastPing = Date.now();
var timeOut = 5000;

//Initialize a client
const setup = function (name, sett, coCb_, decoCb_, errCb_) {
	if (!sett.type || !sett.brokerIp || !sett.port || !sett.pswrd) {
		if (!sett.type) {
			console.log('Error: missing ".type" configuration');
		}
		if (!sett.brokerIp) {
			console.log('Error: missing ".brokerIp" configuration');
		}
		if (!sett.port) {
			console.log('Error: missing ".port" configuration');
		}
		if (!sett.pswrd) {
			console.log('Error: missing ".pswrd" configuration');
		}
		process.exit(1);
	}
	setting = sett;
	set = true;

	//Set callback		
	coCb = coCb_;
	//msCb = msCb_;
	decoCb = decoCb_;
	errCb = errCb_;

	common.init(name, errCb, send);

	console.log('ID: ' + common.id());
	lastPing = Date.now();
	if (setting.type == 'UDP') {
		console.log('Connecting to UDP ' + setting.brokerIp + ':' + setting.port + ' .. ');
		clientUDP.init(openCb, messageCb, closeCb, errCb);
	} else if (setting.type == 'WS') {
		console.log('Connecting to WS ' + setting.brokerIp + ':' + setting.port + ' .. ');
		clientWS.init(openCb, messageCb, closeCb, errCb, setting.brokerIp, setting.port);
	}

	//Automatic reconnection
	setInterval(reconnect, autoRecoTimeOut);
};


const openCb = function (address, port) {
	common.setCo(true);
	console.log('WS: ' + address + ':' + port + ', Autentification..');
	common.publish('/login', { pswrd: setting.pswrd });
	setTimeout(function () {
		if (token == -1) {
			console.log('Fail Auth.. Please verify password configuration');
		}
	}, 5000);
	coCb();
}

const messageCb = function (message, remote) {
	lastPing = Date.now();
	console.log('Message received: ' + message)
	var data = common.incomingMsg(message, remote);
	if (!data) {
		return;
	}

	//Direct order	
	if (data.topic == '/login' && data.token) {
		token = data.token;
		console.log('Succes ! token : ' + data.token);
		coCb();
	}
	if (data.topic == '/invalid') {
		common.publish('/login', { pswrd: setting.pswrd });
	}
	if (data.topic == '/CORE/ping' && data.ask == true) {
		//common .publish('/CORE/ping', {});
		publish('/CORE/ping', {});
	}
	if (data.topic == '/LOOP/change' && data.for && data.for == common.id()) {
		changeLoopFreq(data);
	}
	if (data.topic == '/CORE/exit' && data.for && data.for == common.id()) {
		process.exit(1);
	}
}

const closeCb = function () {
	decoCb();
}

//Specifique send instruction
function send(data, txt) {
	if (setting.type == 'UDP') {
		clientUDP.send(setting.brokerIp, setting.port, data, txt);
	} else if (setting.type == 'WS') {
		clientWS.send(data, txt);
	}
}


function reconnect() {
	if (set && !common.getCo()) {
		setup(common.name(), setting, coCb, decoCb, errCb);
	}
	if ((Date.now() - lastPing) > timeOut) {
		//common .warn('Timeout..');
		errCb('Timeout..');
		setup(common.name(), setting, coCb, decoCb, errCb);
	}
};

const disconnect = function () {
	set = false;
	client.close();
};

const publish = function (topic, msg) {
	msg.token = token;
	return common.publish(topic, msg);
};

module.exports = {
	setup,
	disconnect,
	publish,
	subscribe: common.subscribe,
	unsubscribe: common.unsubscribe,
	name: common.name(),
	id: common.id(),
	ip: common.ip(),
};