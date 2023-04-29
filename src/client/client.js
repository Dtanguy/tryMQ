const clientUDP = require('./clientUDP.js');
const clientWS = require('./clientWS.js');
const utils = require('../utils.js');

var client;
var coCb, msCb, errCb, decoCb;
var autoRecoTimeOut = 2000;
var token = -1;
var lastPing = Date.now();
var timeOut = 5000;

var subscribed = {};
var setting, name, id, hostname, ip;
var connected = false;


/***********************************************************************/
/*                         SETUP & CONNECTION                          */
/***********************************************************************/

async function setup(name_, setting_, coCb_, decoCb_, errCb_) {
	if (!setting_.type) {
		console.log('Error: missing ".type" configuration');
		process.exit(1);
	}
	if (!setting_.brokerIp) {
		console.log('Error: missing ".brokerIp" configuration');
		process.exit(1);
	}
	if (!setting_.port) {
		console.log('Error: missing ".port" configuration');
		process.exit(1);
	}
	if (!setting_.pswrd) {
		console.log('Error: missing ".pswrd" configuration');
		process.exit(1);
	}

	setting = setting_;

	coCb = coCb_;
	errCb = errCb_;
	decoCb = decoCb_;

	name = name_
	id = utils.setId(name);
	let r = await utils.getLocalIp();
	ip = r.ip;
	hostname = r.hostname;
	console.log('ID: ' + id + ' IP: ' + ip + ' Hostname: ' + hostname);

	connect();
	setTimeout(reconnect, autoRecoTimeOut);
};

function connect() {
	lastPing = Date.now();
	if (setting.type == 'UDP') {
		console.log('Connecting to UDP ' + setting.brokerIp + ':' + setting.port + ' .. ');
		client = clientUDP.init(openCb, messageCb, disconnected, errCb);
	} else if (setting.type == 'WS') {
		console.log('Connecting to WS ' + setting.brokerIp + ':' + setting.port + ' .. ');
		client = clientWS.init(openCb, messageCb, disconnected, errCb, setting.brokerIp, setting.port);
	}
}

function reconnect() {
	if (connected == false) {
		console.warn('Disconnected..');
		connect();
	}
	if ((Date.now() - lastPing) > timeOut) {
		console.warn('Timeout..');
		connect();
	}
	setTimeout(reconnect, autoRecoTimeOut);
};

function disconnected() {
	connected = false;
	decoCb();
}


/***********************************************************************/
/*                            MESSAGE & COM                            */
/***********************************************************************/

function openCb(address, port) {
	connected = true;
	console.log('WS: ' + address + ':' + port + ', Autentification..');
	let toSend = {
		topic: '/login',
		token,
		from: id,
		hostname,
		ip,
		timestamp: Date.now(),
		pswrd: setting.pswrd
	};
	send(toSend);
	setTimeout(() => {
		if (token == -1) {
			console.log('Fail Auth.. Please verify password configuration');
		}
	}, 5000);
	coCb();
}

function messageCb(message, remote) {
	lastPing = Date.now();
	var data = utils.parseMsg(subscribed, message, remote);
	if (!data) return;

	// If it's me ?!
	if (data.from == id) {
		console.warn("Speak to myself, something weird is going one");
		return;
	}

	//Direct order	
	if (data.topic == '/login' && data.token) {
		token = data.token;
		console.log('Succes ! token : ' + data.token);
		coCb();
	} else if (data.topic == '/invalid') {
		//publish('/login', { pswrd: setting.pswrd });
		let toSend = {
			topic: '/login',
			token,
			from: id,
			hostname,
			ip,
			timestamp: Date.now(),
			pswrd: setting.pswrd
		};
		send(toSend);
	} else if (data.topic == '/CORE/ping' && data.ask == true) {
		//common .publish('/CORE/ping', {});
		publish('/CORE/ping', {});
	} else if (data.topic == '/LOOP/change' && data.for && data.for == id) {
		changeLoopFreq(data);
	} else if (data.topic == '/CORE/exit' && data.for && data.for == id) {
		process.exit(1);
	}
}

function publish(topic, msg) {
	if (!msg || !topic || !connected || token == -1) return;
	delete msg.port;
	delete msg.address;
	let toSend = {
		topic,
		token,
		from: id,
		hostname,
		ip,
		timestamp: Date.now(),
		data: msg,
	};
	send(toSend);
}

function send(data) {
	try {
		var txt = JSON.stringify(data);
	} catch (e) {
		console.error(e)
	};
	if (setting.type == 'UDP') {
		clientUDP.send(setting.brokerIp, setting.port, txt);
	} else if (setting.type == 'WS') {
		clientWS.send(txt);
	}
}

function subscribe(topic, callback) {
	if (!topic || !callback) return;
	subscribed[topic] = callback;
}

function unsubscribe(topic) {
	subscribed[topic] = '';
}

module.exports = {
	setup,
	disconnected,
	publish,
	subscribe,
	unsubscribe,
	name,
	id,
	ip,
};