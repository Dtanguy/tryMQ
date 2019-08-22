function core() {
	
	let Buffer = require('buffer').Buffer;
	let dgram = require('dgram');
	let crypto = require('crypto');
	let WebSocketServer = require('ws').Server;
	let sharedFunction = require('./sharedFunction');
	
	let param = {};
	let server = {};	
	let client = {};	
	let errorCb;
		
	let workingData = {
		name       : 'noName',
		id         : 'noName-12345',
		hostname   : -1,
		ip         : -1,
		connected  : false,
		subscribed : {},
		startTime  : Date.now()
	};
	

	//Initialize a broker	
	this.setup = function(name_, param_, errorCb_) {
		
		if(errorCb_){
			errorCb = errorCb_;
		}else{
			errorCb = function(err, code){
				if(code == 0){
					console.warn(err);
				}else{
					console.error(err);
				}
			}
		}
		param = param_
		
		var res = sharedFunction.loadParam(name_);
		workingData = Object.assign(workingData, res);	
		
		loop();

		//Init UDP server found in the config
		if(param.portUDP && param.brokerIpUDP){
			for(i = 0; i < param.brokerIpUDP.length; i++){
				this.initUDP(param.portUDP, param.brokerIpUDP[i]);
			}
		}
		
		// Init websocket server found in the config
		if(param.portWS &&  param.brokerIpWS){
			this.initWS(param.portWS, param.brokerIpWS);
		}
		
		// Init links
		if(param.linksIp){
			if(param.linksIp.port && param.linksIp.brokerIp && param.linksIp.pswrd){
				linkIp(param.linksIp.port, param.linksIp.brokerIp, param.linksIp.pswrd);
				
				//Automatic reconnection
				let intervalID = setInterval(function() { 
					if(linkMaster.set && !linkMaster.connected){
						errorCb('No connection..', 0);
						linkIp(param.linksIp.port, param.linksIp.brokerIp, param.linksIp.pswrd);
					}else if( (Date.now()-linkMaster.lastPing) > linkMaster.timeOut){
						//errorCb('Timeout..', 0);
						//linkIp(param.linksIp.port, param.linksIp.brokerIp, param.linksIp.pswrd);
					}
				}, linkMaster.autoRecoTimeOut); 
				
			}		
		}
	};
	
	
	//Specifique send instruction
	function send(data){		
		Queue[data.topic] = data;
	};



	/*************************************************** LINK **********************************************/	
	let linkMaster = {
		brokerIp 		: -1,
		port	 		: -1,
		pswrd	 		: '',
		set		 		: false,
		connected		: false,
		uid		 		: crypto.randomBytes(8).toString('hex'),
		autoRecoTimeOut	: 2000,
		lastPing 		: -1,
	    timeOut 		: 5000,
	};
	
	//Specifique send instruction
	function send_cli(data){
		let txt = JSON.stringify(data);
		let message = new Buffer.alloc(txt.length, txt);			
		server[linkMaster.uid].send(message, 0, message.length, linkMaster.port, linkMaster.brokerIp, function(err, bytes) {
			//The message have been send
		});	
	}	
	
	function linkIp(port, brokerIp, pswrd) {		
		linkMaster.set = true;
		server[linkMaster.uid] = dgram.createSocket('udp4');			
		console.log('Connecting to ' + brokerIp + ':' + port + ' .. ');		
		linkMaster.port = port;
		linkMaster.brokerIp = brokerIp;
		
		server[linkMaster.uid].on('listening', () => {
			console.log('UDP: ' + brokerIp + ':' + port + ', Autentification..');
			sharedFunction.publish('/login', {pswrd: pswrd}, workingData, send_cli, errorCb);
			setTimeout(function(){
				if(!linkMaster.connected){
					console.log('Fail Auth.. Please verify password configuration');
				}
			}, 5000);
		});
		
		//Incoming messages
		server[linkMaster.uid].on('message', (message, remote) => {
			linkMaster.connected = true;
			linkMaster.lastPing = Date.now();
			let meta = {
				id: 		linkMaster.uid,
				type: 		"udp",
				address: 	remote.address,
				ip: 		remote.address,
				port: 		remote.port
			};			
			newMessage(message, meta);			
			
		});
		
		//Connection error
		
		server[linkMaster.uid].on('error', (err) => {
			errorCb(err, 1);
		});
		
		server[linkMaster.uid].bind();		
	}
	
	
		
 
 

	/*************************************************** UDP **********************************************/
	this.initUDP = function(port, brokerIp) {
		
		let id = crypto.randomBytes(8).toString('hex');
		server[id] = dgram.createSocket('udp4');

		server[id].on('listening', function () {
			let address = server[id].address();
			console['log']('TryMQ UDP broker listening on ' + address.address + ":" + address.port);
		});

		server[id].on('message', function (message, remote) {			
			let meta = {
				id: 		id,
				type: 		"udp",
				address: 	remote.address,
				ip: 		remote.address,
				port: 		remote.port
			};			
			newMessage(message, meta);	
		});

		server[id].on('error', function (err) {
			errorCb(err, 1);
		});

		server[id].on('close', function () {
			console['log']('CLOSE UDP');
		});

		server[id].bind(port, brokerIp);	
		
	};


	/*************************************************** WS **********************************************/
	this.initWS = function(portWS, brokerIp) {		
		
		let wss = new WebSocketServer({port: portWS});	
		
		wss.on('listening', function(ws) {
			console['log']('TryMQ WS broker listening on ' + brokerIp + ":" + portWS);
		});

		wss.on('connection', function(ws, req) {
			console['log']('TryMQ WS new connection ' + req.connection.remoteAddress + ":" + portWS);
			let id = crypto.randomBytes(8).toString('hex');
			server[id] = ws;
			
			server[id].on('message', function(message) {
				let meta = {
					id: 		id,
					type: 		"ws",
					address: 	req.connection.remoteAddress.replace('::ffff:',''),
					ip: 		req.connection.remoteAddress.replace('::ffff:',''),
					port: 		portWS
				};			
				newMessage(message, meta);		
			});	
			
			server[id].on('error', function (err) {
				errorCb(err, 1);
			});
				
			server[id].on('close', function () {
				console['log']('CLOSE WS');
			});	
		
		});
	
	};
	
	
	
	
	
	/*************************************************** GLOBAL **********************************************/
	
	let clients = {};
	let topics = {};
	
	let verbose = false;
	let loopFreq = 50;
	let Queue = {};

	//login + mdp = token = identification
	function newMessage(message, meta){
		
		let data = sharedFunction.incomingMsg(message, meta, workingData, errorCb);
		if(!data){
			errorCb('Empty parse result', 0);
			return;
		}
		console.log(data);	
		
		let from = data.path[data.path.length-1];

		if(!clients[from]){
			clients[from] = {
				id: meta.id,
				address:  meta.address,
				port: meta.port,
				type: meta.type,
				token: crypto.randomBytes(8).toString('hex'),
				lastPing: Date.now()
			};
		}		
		
		// Ask for Auth
		if(data.topic == '/login' && data.pswrd && data.token){
			if(data.pswrd == param.pswrd){
				clients[from].token = data.token;
			}else{
				errorCb('1)INVALID TOKEN from ' + from + ' on ' + data.topic, 0)
			}
			return;
		}else if(data.topic == '/login' && data.pswrd){	
			if(data.pswrd == param.pswrd){		
				let msg = {};
				msg.for = from;
				//if(param.linksIp && param.linksIp[0] && param.linksIp[0].pswrd){
				//	console.log("eeeee");
					msg.pswrd = param.pswrd
				//}
				msg.token = crypto.randomBytes(8).toString('hex');
				clients[from].token = msg.token;
				console.log('Login token: ' + '\x1b[32m' + msg.token + '\x1b[36m' + " for " + '\x1b[32m' + from + '\x1b[36m');
				sharedFunction.publish('/login', msg, workingData, send, errorCb);
			}else{
				errorCb('2)INVALID TOKEN from ' + from + ' on ' + data.topic, 0)
			}
			return;
		}	
			
		
		// Is Auth ok ?
		if(data.token){				
			if(data.token != clients[from].token){				
				errorCb('INVALID TOKEN from ' + from + ' on ' + data.topic, 0)
				let msg = {};
				msg.for = from;
				sharedFunction.publish('/invalid', msg, workingData, send, errorCb);
				return;
			}
		}
		
		// Here we are sur to be loged
		data.token = -1;
		sharedFunction.publish(data.topic, data, workingData, send, errorCb);
		
		/*if(data.topic == '/CORE/ping' && data.rep == true){
			console.log("IT HERE");
		}*/
		
		
		
		
		
		/*		
		
		try{
						
			// If it's the first time this client show
			if(!clients[data.from]){
				clients[data.from] = {
					id : -1,
					address : -1,
					port : -1,
					subscribed : {},
					pushed : {},
					startDate : Date.now(),
					lastPush : Date.now(),
					lastPing : Date.now(),
					//token : crypto.randomBytes(8).toString('hex'),
				};
				clients[data.from].pushed['/CORE/all'] = 0;
			}			
			if(!clients[data.from].token){
				clients[data.from].token = crypto.randomBytes(8).toString('hex')
			}
			
			clients[data.from].id = meta.id;
			clients[data.from].type = meta.type;
			clients[data.from].address = meta.address;
			clients[data.from].ip = meta.ip;
			clients[data.from].port = meta.port;
			clients[data.from].lastPush = Date.now();
			clients[data.from].lastPing = Date.now();
			clients[data.from].pushed['/CORE/all'] += 1;
			
			if(!clients[data.from].pushed[data.topic] ){
				clients[data.from].pushed[data.topic] = 0;
			}
			clients[data.from].pushed[data.topic] += 1;

			//Manage topics data
			if(!topics[data.topic]){
				topics[data.topic] = {
					nbMsg : 0,
					subscriber : {},
					publisher : {},
					startDate : Date.now(),
					lastMsg : Date.now(),
				};
			}
			
			topics[data.topic].nbMsg += 1;
			topics[data.topic].lastMsg = Date.now();
			
			if(!topics[data.topic].publisher[data.from]){
				topics[data.topic].publisher[data.from] = 0;
			}
			topics[data.topic].publisher[data.from] += 1;
			

			//Manage authentification
			if(data.topic == '/login'){				
				if(data.pswrd && data.from){
					if(data.pswrd == param.pswrd){												
						let msg = {};
						msg.token = crypto.randomBytes(8).toString('hex');
						msg.for = data.from;
						console.log(msg.token);
						sharedFunction.publish('/login', msg, workingData, send, errorCb);
						clients[data.from].token = msg.token;
					}
				}		
			}else{	
				
				//sharedFunction.auto_cmd(data, workingData, clients[data.from].token, send, errorCb);
				
				// If auth is a success
				if(data.token == clients[data.from].token){
					// Remove token and propage message
					delete data.token;	
				}
				
				// If auth fail
				else{
					errorCb('INVALID TOKEN from ' + data.from + ' on ' + data.topic, 0)
					let msg = {};
					msg.for = data.from;
					sharedFunction.publish('/invalid', msg, workingData, send, errorCb);
					return;
				}
				
				//CORE cmd
				let normal = false;
				if(data.ask){	
					let msg = {}
					switch(data.topic) {
						//case '/CORE/ping':
							//normal = true;
							//break;
						case '/CORE/info':
							msg.clients = clients;
							msg.topics = topics;
							sharedFunction.publish('/CORE/info', msg, workingData, send, errorCb);
							break;
						case '/CORE/clients':
							msg.clients = clients;
							sharedFunction.publish('/CORE/clients', msg, workingData, send, errorCb);
							break;
						case '/CORE/topics':
							msg.topics = topics;
							sharedFunction.publish('/CORE/topics', msg, workingData, send, errorCb);
							break;
						default:
							normal = true;
							//return;
					}			
				}else{
					normal = true;
				}
				
				// Just relay normal message (typical case)
				if(normal){
					if(data.topic == '/CORE/ping' && data.rep == true){
						console.log("IT HERE");
					}
					sharedFunction.publish(data.topic, data, workingData, send, errorCb, true);
				}
				
			}
			
		}catch(err){
			errorCb(err, 1);
			return;
		}
		*/
		
	};

	



	function propage(data){		
		try {	
			for(let cli in clients) {
				
				//Get the right token for the right client
				console.log(data.topic + " " + data.token + " " + clients[cli].token);
				data.token = clients[cli].token;
				let txt = JSON.stringify(data);
				let msg = new Buffer.alloc(txt.length, txt); 
				
				// If message have an explicit for destination, skip all the other cli
				if(data.for){
					if(cli != data.for){
						continue;
					}
				}
				
				//console.log("=== " + cli);
				if(data.path.indexOf(cli)>-1){
					//console.log("nope");
					continue;
				}				
				
				// Different type of message and sending
				if(clients[cli].id && clients[cli].type && server[clients[cli].id]){
					if(clients[cli].type == "udp"){						
						server[clients[cli].id].send(msg, 0, msg.length, clients[cli].port, clients[cli].address, function(err, bytes) {
							if (err) {
								console['warn']("UDP error, remove");
								delete server[clients[cli].id];
								throw err;
							}
						});
					}else if(clients[cli].type == "ws"){
						if(server[clients[cli].id].readyState == 1){
							server[clients[cli].id].send(msg.toString(), function(err){
								if (err) {
									console['warn']("Websocket error, remove");
									delete server[clients[cli].id];
									throw err;
								}
							});
						}else{
							console['warn']("Websocket closed, remove");
							delete server[clients[cli].id];
						}
					}
				}

			}		
		}catch(err){
			errorCb(err, 1);
		}
	};

/*
	let pingTimeout = 4000;
	setInterval(function() { 
		for(let cli in clients) {
			if (Date.now() - clients[cli].lastPing > pingTimeout){
				console['warn']("Client " + cli + " ping timeout, remove");
				delete clients[cli];
			}
		}
		sharedFunction.publish('/CORE/ping', {ask: true}, workingData, send, errorCb);
	}, pingTimeout);
*/

	this.setLoop = function(delay){
		loopFreq = delay;
	};	
	
	function loop() {
		setTimeout(function() {
			for(let ms in Queue){	
				propage(Queue[ms]);	
			}
			Queue = {};
			loop();
		}, loopFreq);
	};
	
	this.clients = function(){
		return clients;
	};
	
	this.topics = function(){
		return topics;
	};	
	
	this.resetClients = function(){
		clients = {};
	};
	
	this.resetTopics = function(){
		topics = {};
	};	
	
	this.reset = function(){
		clients = {};
		topics = {};
	};	
	
	this.logOut = function(cli){
		if(clients[cli]){
			client[cli].token = crypto.randomBytes(8).toString('hex');
		}
	};
	
	/***************************************** SHARED **********************************************/
	
	this.publish = function(topic, msg, add){		
		return sharedFunction.publish(topic, msg, workingData, send, errorCb, add);
	};


	this.subscribe = function(topic, callback){	
		return sharedFunction.subscribe(topic, callback, workingData);	
	};	
	
	this.unsubscribe = function(topic){
		return sharedFunction.unsubscribe(topic, workingData);	
	};

	this.name = function() {
		return workingData.name;
	};	
	
	this.id = function() {
		return workingData.id;
	};
	
	this.ip = function() {
		return workingData.ip;
	};
	
}

module.exports = core;