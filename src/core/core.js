var Buffer = require('buffer').Buffer;
var crypto = require('crypto');

var listenerUDP = require('../core/listenerUDP.js');
var listenerWS = require('../core/listenerWS.js');
const utils = require('../utils.js');

var setting = {};
var server = {};
var errorCb;

var subscribed = {};
var setting, name, id, hostname, ip;


/***********************************************************************/
/*                         SETUP & CONNECTION                          */
/***********************************************************************/

async function setup(name_, setting_, errorCb_) {
	if (!setting_.pswrd) {
		console.log('Error: missing ".pswrd" configuration');
		process.exit(1);
	}
	if (!setting_.brokerIpUDP && !setting_.brokerIpWS) {
		console.log('Error: missing ".brokerIp" configuration');
		process.exit(1);
	}
	if (!setting_.portUDP && !setting_.portWS) {
		console.log('Error: missing ".port" configuration');
		process.exit(1);
	}
	setting = setting_;

	errorCb = errorCb_;
	name = name_
	id = utils.setId(name);
	let r = await utils.getLocalIp();
	ip = r.ip;
	hostname = r.hostname;

	//Init all the server found in the config
	if (setting.portUDP && setting.brokerIpUDP) {
		for (i = 0; i < setting.brokerIpUDP.length; i++) {
			var id_ = crypto.randomBytes(8).toString('hex');
			server[id_] = listenerUDP.initUDP(setting.portUDP, setting.brokerIpUDP[i], id, newMessage, upError);
		}
	}
	if (setting.portWS && setting.brokerIpWS) {
		listenerWS.initWS(setting.portWS, setting.brokerIpWS, '', newMessage, upError, (add) => {
			server[add.id] = add.ws;
		});
	}

	console.log('Ready ID: ' + id + ' IP: ' + ip + ' Hostname: ' + hostname);
	loop();
};



/***********************************************************************/
/*                            MESSAGE & COM                            */
/***********************************************************************/

function publish(topic, msg, add = false) {
	if (!msg || !topic) {
		return;
	}

	try {
		delete msg.port;
		delete msg.address;
		msg.topic = topic;
		msg.timestamp = Date.now();
		if (!add) {
			msg.from = id;
			msg.hostname = hostname;
			msg.ip = ip;
		}

		send(msg);
	} catch (e) {
		errorCb(e, 0);
	}
}

function subscribe(topic, callback) {
	if (!topic || !callback) return;
	subscribed[topic] = callback;
}

function unsubscribe(topic) {
	subscribed[topic] = '';
}

function send(data, txt) {
	try {
		var txt = JSON.stringify(data);
	} catch (e) {
		console.error(e)
	};
	Queue[data.topic] = { d: data, m: txt };
};

/***********************************************************************/
/*                            CORE MECANICS                            */
/***********************************************************************/

function upError(err, code) {
	if (!err) {
		errorCb('Error, no error.. -_-"', 0);
		return;
	}
	if (errorCb) {
		errorCb(err, code);
	} else {
		if (code == 0) {
			console.warn(err);
		} else {
			console.error(err);
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
	var data = utils.parseMsg(subscribed, message, meta);
	if (!data) return;

	// If it's me ?!
	if (data.from == id) {
		console.warn("Speak to myself, something weird is going one");
		return;
	}

	try {
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
				if (data.pswrd == setting.pswrd) {
					var msg = {};
					msg.token = crypto.randomBytes(8).toString('hex');
					msg.for = data.from;
					publish('/login', msg);
					clients[data.from].token = msg.token;
				}
			}
			//Manage ping			
		} else {
			if (data.token == clients[data.from].token) {
				delete data.token;
				publish(data.topic, data, true);
			} else {
				upError('INVALID TOKEN from ' + data.from + ' on ' + data.topic, 0)
				var msg = {};
				msg.for = data.from;
				publish('/invalid', msg);
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
				publish('/CORE/info', msg);
				break;
			case '/CORE/clients':
				msg.clients = clients;
				publish('/CORE/clients', msg);
				break;
			case '/CORE/topics':
				msg.topics = topics;
				publish('/CORE/topics', msg);
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
					server[clients[cli].id].send(msg, 0, msg.length, clients[cli].port, clients[cli].address, (err, bytes) => {
						if (err) {
							console.warn("UDP error, remove");
							delete server[clients[cli].id];
							throw err;
						}
					});
				} else if (clients[cli].type == "ws") {
					if (server[clients[cli].id].readyState == 1) {
						server[clients[cli].id].send(msg.toString(), (err) => {
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
	publish('/CORE/ping', msg);
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

function setLoop(delay) {
	loopFreq = delay;
};

function resetClients() {
	clients = {};
};

function resetTopics() {
	topics = {};
};

function reset() {
	clients = {};
	topics = {};
};

function logOut(cli) {
	if (clients[cli]) {
		client[cli].token = crypto.randomBytes(8).toString('hex');
	}
};



module.exports = {
	setup,
	publish,
	subscribe,
	unsubscribe,

	setLoop,
	clients,
	topics,
	resetClients,
	resetTopics,
	reset,
	logOut,
	name,
	id,
	ip,
};