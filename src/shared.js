
var os = require('os');
var net = require('net');

//Info
var name       = 'noName';
var id         = 'noName-12345';
var hostname   = os.hostname();
var ip         = -1; 
var startTime  = Date.now();  

//Connection
var subscribed = {};
var connected  = false;
var errorCb, sendCb;

module.exports = {
	
	//Set callback and generate ID
	init: function(name_, errorCb_, sendCb_){
		
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
		try {
			var socket = net.createConnection(80, 'www.google.com');
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

	},
	
	
	
	
	
	
	
	//Parse message
	incomingMsg: function(message, remote){
		
		//parse
		var msg = JSON.parse(message);
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
	},
	
	//Manage subscription
	redirect: function(msg){
		if(subscribed[msg.topic] && msg.from != id){				
			try {
				subscribed[msg.topic](msg);
			} catch (e) {
				errorCb(e, 0);
			}
		}
	},	
	
	// setter / getter conenction state
	setCo: function(bool){
		connected = bool;	
	},
	getCo: function(){
		return connected;	
	},
	
	//Publish messages
	publish: function(topic, msg, add){	
		
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
			var txt = JSON.stringify(msg);
			//console.log(msg);
			sendCb(msg, txt);					
		}catch(e){
			errorCb(e, 0);
		}
	},
	

	//Subscribe to topics
	subscribe: function(topic, callback){	
		if(!topic || !callback){
			return;
		}
		subscribed[topic] = callback;	
	},	
	
	unsubscribe: function(topic){
		subscribed[topic] = '';	
	},
	
	subscribtion: function(){
		return subscribed;
	},
	
	name: function(){
		return name;
	},
	
	id: function() {
		return id;
	},
	
	hostname: function() {
		return hostname;
	},
	
	ip: function(){
		return ip;
	},
	
	upTime: function(){
		return Date.now() - startTime;
	},
 	
	
	//Somes color on the log
	error: function(txt) {
		//this.publish('/ERROR', {err: txt});
		console['error'](txt);	
	},
	
	warn: function(txt) {
		//this.publish('/WARN', {warn: txt});
		console['warn'](txt);	
	},
	
	log: function(txt) {
		//this.publish('/LOG', {log: txt});
		console['log'](txt);
	}
  
};


// Some color
[
	[ 'warn',  '\x1b[35m' ],
	[ 'error', '\x1b[31m' ],
	[ 'log',   '\x1b[2m'  ]
].forEach(function(pair) {
	var method = pair[0], reset = '\x1b[0m', color = '\x1b[36m' + pair[1];
	console[method] = console[method].bind(console, color, method.toUpperCase(), reset);
});	