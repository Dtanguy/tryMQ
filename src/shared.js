function shared() {
	
	let os = require('os');
	let net = require('net');

	//Info
	let name       = 'noName';
	let id         = 'noName-12345';
	let hostname   = os.hostname();
	let ip         = -1; 
	let startTime  = Date.now();  

	//Connection
	let subscribed = {};
	let connected  = false;
	let errorCb, sendCb;
	
	//Set callback and generate ID
	this.init = function(name_, errorCb_, sendCb_){
		
		errorCb = errorCb_;
		sendCb = sendCb_;
		connected = false;
		if(name_ != ''){
			name = name_;
		}else{
			name = 'noName';
		}

		id = name + '-' + Math.random().toString(16).substr(2, 8);	
		
		// Find my own ip
		let socket;
		try {
			socket = net.createConnection(80, 'www.google.com');
		} catch (e) {
			errorCb('Can\'t get my own IP ' + e, 0);
		}
		socket.on('connect', function() {			
			ip = socket.address().address;
			socket.end();
		});
		socket.on('error', function(e) {
			errorCb('Error in socket ' + e, 0);
		});

	};
	
	
	
	
	
	
	
	//Parse message
	this.incomingMsg = function(message, remote){
		
		//parse
		let msg = {};
		try{
			msg = JSON.parse(message);
		}catch(err){
			errorCb('Error JSON.pase fail', 0);
			return;
		}
		
		if (!msg.topic){
			errorCb('No topic', 0);
			return;
		}
		
		if (!msg.from){
			errorCb('No from ID', 0);
			return;
		}
		
		if(remote.address){
			msg.address = remote.address;
		}
		if(remote.port){
			msg.port = remote.port;
		}
		/*
		if(remote.id){
			msg.id = remote.id;
		}
		*/
		if (!msg.topic[msg.topic]){
			msg.topic[msg.topic] = '';
		}
		
		if(subscribed[msg.topic] && msg.from != id){				
			try {
				subscribed[msg.topic](msg);
			} catch (e) {
				errorCb(e, 0);
			}
		}
		
		if(subscribed['/CORE/all']){
			subscribed['/CORE/all'](msg);
		}
		
		return msg;
	};
	
	//Manage subscription
	this.redirect = function(msg){
		if(subscribed[msg.topic] && msg.from != id){				
			try {
				subscribed[msg.topic](msg);
			} catch (e) {
				errorCb(e, 0);
			}
		}
	};
	
	// setter / getter conenction state
	this.setCo = function(bool){
		connected = bool;	
	};
	
	this.getCo = function(){
		return connected;	
	};
	
	//Publish messages
	this.publish = function(topic, msg, add){	
		
		if(!msg || !topic || !connected){			
			return;
		}

		try {
			delete msg.port;
			delete msg.address;
			msg.topic = topic;
			if(!add){
				msg.from = id;
				msg.hostname = hostname;
				msg.ip = ip;
			}
			let txt = JSON.stringify(msg);
			//console.log(msg);
			sendCb(msg, txt);					
		}catch(e){
			errorCb(e, 0);
		}
	};
	

	//Subscribe to topics
	this.subscribe = function(topic, callback){	
		if(!topic || !callback){
			return;
		}
		subscribed[topic] = callback;	
	};	
	
	this.unsubscribe = function(topic){
		subscribed[topic] = '';	
	};
	
	this.subscribtion = function(){
		return subscribed;
	};
	
	this.name = function(){
		return name;
	};
	
	this.id = function() {
		return id;
	};
	
	this.hostname = function() {
		return hostname;
	};
	
	this.ip = function(){
		return ip;
	};
	
	this.upTime = function(){
		return Date.now() - startTime;
	};
 	
	
	//Somes color on the log
	this.error = function(txt) {
		//this.publish('/ERROR', {err: txt});
		console['error'](txt);	
	};
	
	this.warn = function(txt) {
		//this.publish('/WARN', {warn: txt});
		console['warn'](txt);	
	};
	
	this.log = function(txt) {
		//this.publish('/LOG', {log: txt});
		console['log'](txt);
	};
  
}

module.exports = shared;

// Some color
[
	[ 'warn',  '\x1b[35m' ],
	[ 'error', '\x1b[31m' ],
	[ 'log',   '\x1b[2m'  ]
].forEach(function(pair) {
	let method = pair[0], reset = '\x1b[0m', color = '\x1b[36m' + pair[1];
	console[method] = console[method].bind(console, color, method.toUpperCase(), reset);
});	