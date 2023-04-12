//var os = require('os');
var Buffer = require('buffer').Buffer;
var crypto = require('crypto');

var listenerUDP = require('../core/listenerUDP.js');
var listenerWS = require('../core/listenerWS.js');
var common = require('../common.js');
const logger = require('../logger.js');

var param = {};
var server = {};
var errorCb;

//Initialize a broker	
const setup = function (id_, param_, errorCb_) {
	errorCb = errorCb_;
	param = param_
	common.init(id_, upError, send);
	common.setCo(true);

	//Init all the server found in the config
	if (param.portUDP && param.brokerIpUDP) {
		for (i = 0; i < param.brokerIpUDP.length; i++) {
			var id = crypto.randomBytes(8).toString('hex');
			server[id] = listenerUDP.initUDP(param.portUDP, param.brokerIpUDP[i], id, newMessage, upError);
		}
	}
	if (param.portWS && param.brokerIpWS) {
		var id = crypto.randomBytes(8).toString('hex');
		server[id] = listenerWS.initWS(param.portWS, param.brokerIpWS, id, newMessage, upError);
	}

	console['log']("Started " + common.id);
	loop();
};


//Specifique send instruction
function send(data, txt) {
	Queue[data.topic] = { d: data, m: txt };
};

//Push to the upper level the error
function upError(err, code) {
	if (!err) {
		errorCb('Error, no error.. -_-"', 0);
		return;
	}
	if (errorCb) {
		errorCb(err, code);
	} else {
		if (code == 0) {
			common.warn(err);
		} else {
			common.error(err);
		}
	}
};

/*************************************************** GLOBAL **********************************************/

var clients = {};
var topics = {};

var verbose = false;
var loopFreq = 50;
var Queue = {};

//login + mdp = token = identification
function newMessage(message, meta) {

	var data = common.incomingMsg(message, meta);
	if (!data) {
		upError('Empty parse result', 0)
		return;
	}

	try {
		// If it's me ?!
		if (data.from == common.id) {
			console.warn("Speak to myself, something weird is going one");
			return;
		}

		// If it's the first time this client show
		if (!clients[data.from]) {
			clients[data.from] = {
				id: -1,
				address: -1,
				port: -1,
				subscribed: {},
				pushed: {},
				startDate: Date.now(),
				lastPush: Date.now(),
				lastPing: Date.now(),
				token: crypto.randomBytes(8).toString('hex'),
			};
			clients[data.from].pushed['/CORE/all'] = 0;
		}

		clients[data.from].id = meta.id;
		clients[data.from].type = meta.type;
		clients[data.from].address = meta.address;
		clients[data.from].ip = meta.ip;
		clients[data.from].port = meta.port;
		clients[data.from].lastPush = Date.now();
		clients[data.from].lastPing = Date.now();
		clients[data.from].pushed['/CORE/all'] += 1;

		if (!clients[data.from].pushed[data.topic]) {
			clients[data.from].pushed[data.topic] = 0;
		}
		clients[data.from].pushed[data.topic] += 1;

		//Manage topics data
		if (!topics[data.topic]) {
			topics[data.topic] = {
				nbMsg: 0,
				subscriber: {},
				publisher: {},
				startDate: Date.now(),
				lastMsg: Date.now(),
			};
		}

		topics[data.topic].nbMsg += 1;
		topics[data.topic].lastMsg = Date.now();

		if (!topics[data.topic].publisher[data.from]) {
			topics[data.topic].publisher[data.from] = 0;
		}
		topics[data.topic].publisher[data.from] += 1;


		//Manage authentification
		if (data.topic == '/login') {
			if (data.pswrd && data.from) {
				if (data.pswrd == param.pswrd) {
					var msg = {};
					msg.token = crypto.randomBytes(8).toString('hex');
					msg.for = data.from;
					common.publish('/login', msg);
					clients[data.from].token = msg.token;
				}
			}
			//Manage ping			
		} else {
			if (data.token == clients[data.from].token) {
				delete data.token;
				common.publish(data.topic, data, true);
			} else {
				upError('INVALID TOKEN from ' + data.from + ' on ' + data.topic, 0)
				var msg = {};
				msg.for = data.from;
				common.publish('/invalid', msg);
			}
		}

	} catch (err) {
		upError(err, 1);
	}

	//CORE cmd
	if (data.ask) {
		var msg = {}
		switch (data.topic) {
			case '/CORE/info':
				msg.clients = clients;
				msg.topics = topics;
				common.publish('/CORE/info', msg);
				break;
			case '/CORE/clients':
				msg.clients = clients;
				common.publish('/CORE/clients', msg);
				break;
			case '/CORE/topics':
				msg.topics = topics;
				common.publish('/CORE/topics', msg);
				break;
			default:
				return;
		}
	}

};





function propage(data) {
	try {

		var txt = JSON.stringify(data.d);
		let msg = new Buffer.alloc(txt.length, txt);

		for (var cli in clients) {
			if (data.d.for) {
				if (cli != data.d.for) {
					continue;
				}
			}

			if (clients[cli].id && clients[cli].type && server[clients[cli].id]) {
				if (clients[cli].type == "udp") {
					server[clients[cli].id].send(msg, 0, msg.length, clients[cli].port, clients[cli].address, function (err, bytes) {
						if (err) {
							console.warn("UDP error, remove");
							delete server[clients[cli].id];
							throw err;
						}
					});
				} else if (clients[cli].type == "ws") {
					if (server[clients[cli].id].readyState == 1) {
						server[clients[cli].id].send(msg.toString(), function (err) {
							if (err) {
								console.warn("Websocket error, remove");
								delete server[clients[cli].id];
								throw err;
							}
						});
					} else {
						console.warn("Websocket closed, remove");
						delete server[clients[cli].id];
					}
				}
			}
		}

	} catch (err) {
		upError(err, 1);
	}
};

var pingTimeout = 4000;
setInterval(() => {
	for (var cli in clients) {
		if (Date.now() - clients[cli].lastPing > pingTimeout) {
			console.warn("Client " + cli + " ping timeout, remove");
			delete clients[cli];
		}
	}
	var msg = {
		ask: true
	};
	common.publish('/CORE/ping', msg);
}, pingTimeout);

function loop() {
	setTimeout(() => {
		for (var ms in Queue) {
			propage(Queue[ms]);
		}
		Queue = {};
		loop();
	}, loopFreq);
};

const setLoop = function (delay) {
	loopFreq = delay;
};

const resetClients = function () {
	clients = {};
};

const resetTopics = function () {
	topics = {};
};

const reset = function () {
	clients = {};
	topics = {};
};

const logOut = function (cli) {
	if (clients[cli]) {
		client[cli].token = crypto.randomBytes(8).toString('hex');
	}
};


module.exports = {
	setup,
	publish: common.publish,

	subscribe: common.subscribe,
	unsubscribe: common.unsubscribe,
	error: common.error,
	warn: common.warn,
	log: common.log,
	name: common.name,
	id: common.id,
	ip: common.ip,
	setLoop,
	clients,
	topics,
	resetClients,
	resetTopics,
	reset,
	logOut,
};