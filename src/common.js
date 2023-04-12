var os = require('os');
var net = require('net');

//Info
var name = 'noName';
var id = 'noName-12345';
var hostname = os.hostname();
var ip = -1;
var startTime = Date.now();

//Connection
var subscribed = {};
var connected = false;
var errorCb, sendCb;



//Set callback and generate ID
const init = function (name_, errorCb_, sendCb_) {

	errorCb = errorCb_;
	sendCb = sendCb_;
	connected = false;
	if (name_ != '') {
		name = name_;
	} else {
		name = 'noName';
	}

	id = name + '-' + Math.random().toString(16).substr(2, 8);

	// Find my own ip
	try {
		var socket = net.createConnection(80, 'www.google.com');
	} catch (e) {
		errorCb('Can\'t get my own IP ' + e, 0);
	}
	socket.on('connect', function () {
		ip = socket.address().address;
		socket.end();
	});
	socket.on('error', function (e) {
		errorCb('Error in socket ' + e, 0);
	});

}







//Parse message
const incomingMsg = function (message, remote) {

	//parse
	var msg = JSON.parse(message);
	if (!msg.topic) {
		errorCb('No topic', 0);
		return;
	}

	if (!msg.from) {
		errorCb('No from ID', 0);
		return;
	}

	if (remote.address) {
		msg.address = remote.address;
	}
	if (remote.port) {
		msg.port = remote.port;
	}
	/*
	if(remote.id){
		msg.id = remote.id;
	}
	*/
	if (!msg.topic[msg.topic]) {
		msg.topic[msg.topic] = '';
	}

	if (subscribed[msg.topic] && msg.from != id) {
		try {
			subscribed[msg.topic](msg);
		} catch (e) {
			errorCb(e, 0);
		}
	}

	if (subscribed['/CORE/all']) {
		subscribed['/CORE/all'](msg);
	}

	return msg;
}

//Manage subscription
const redirect = function (msg) {
	if (subscribed[msg.topic] && msg.from != id) {
		try {
			subscribed[msg.topic](msg);
		} catch (e) {
			errorCb(e, 0);
		}
	}
}

// setter / getter conenction state
const setCo = function (bool) {
	connected = bool;
}

const getCo = function () {
	return connected;
}

//Publish messages
const publish = function (topic, msg, add) {
	if (!msg || !topic || !connected) {
		return;
	}

	try {
		delete msg.port;
		delete msg.address;
		msg.topic = topic;
		if (!add) {
			msg.from = id;
			msg.hostname = hostname;
			msg.ip = ip;
		}
		var txt = JSON.stringify(msg);
		//console.log(msg);
		sendCb(msg, txt);
	} catch (e) {
		errorCb(e, 0);
	}
}


//Subscribe to topics
const subscribe = function (topic, callback) {
	if (!topic || !callback) {
		return;
	}
	subscribed[topic] = callback;
}

const unsubscribe = function (topic) {
	subscribed[topic] = '';
}

const subscribtion = function () {
	return subscribed;
}

const upTime = function () {
	return Date.now() - startTime;
}





module.exports = {
	init: init,
	incomingMsg: incomingMsg,
	redirect: redirect,
	setCo: setCo,
	getCo: getCo,
	publish: publish,
	subscribe: subscribe,
	unsubscribe: unsubscribe,
	subscribtion: subscribed,
	name: name,
	id: id,
	hostname: hostname,
	ip: ip,
	upTime: upTime,
};