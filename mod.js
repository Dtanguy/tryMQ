// Some color
	[
	 [ 'warn',  '\x1b[35m' ],
	 [ 'error', '\x1b[31m' ],
	 [ 'log',   '\x1b[2m'  ]
	].forEach(function(pair) {
		var method = pair[0], reset = '\x1b[0m', color = '\x1b[36m' + pair[1];
		console[method] = console[method].bind(console, color, method.toUpperCase(), reset);
	});	
	
function mod() {
	
	//Golbal (default setting)
	var setting = {
		brokerAdrr : '127.0.0.1',
		port	   : 33333
	}
	
	var dgram = require('dgram');
	//var rip = require("ip");
	var os = require('os');
	var verbose = true;
	var connected = false;
	var set = false;
	
	//Identify
	var myName = 'noName';
	var myNum = -1;
	var mip = os.hostname();//rip.address();
	var clientId;
	var errorCb;
	
	//Network and subscribtion
	var client;	
	var subscribed = {};	
	var cocb;
	var decocb;
	var autoRecoTimeOut = 2000;
	
	/*************************************************** Core function **********************************************/
	
	this.setup = function(nm, ip, coCall, decoCall, errcb) {
		set = true;
		
		errorCb = errcb;
		
		if(sett && sett.brokerAdrr && set.port){
			setting = sett;
		}

		
		if(nm != ''){
			myName = nm;
		}else{
			myName = 'unKnow';
		}
		myNum =	Math.random().toString(16).substr(2, 8);	
		clientId = myName + '-' + myNum;		
		
		client = dgram.createSocket('udp4');		
		connected = true;
		cocb = coCall;
		decocb = decoCall;
			
		client.on('listening', function () {			
			coCall();		
		});
		
		client.on('message', function (message, remote) {
			
			connected = true;
			//console['log'](remote.address + ':' + remote.port +' - ' + message);
			var data = JSON.parse(message);
			if (!data.topic){
				return;
			}
			
			if(subscribed[data.topic] && data.from != clientId){				
				try {
					subscribed[data.topic](data);
				} catch (err) {
					console['error'](err);
				}
			}
						
			if(subscribed['/CORE/all']){
				var mssg = {};
				mssg.topic = data.topic;
				mssg.payload = data;
				subscribed['/CORE/all'](mssg);
			}
			
			if(data.topic == '/SYS/ping' && data.ask){
				try {		
					var msg = {};
					msg.topic = '/SYS/ping';
					msg.from = clientId;
					msg.ip = mip;
					var txt = JSON.stringify(msg);
					var message = new Buffer(txt);			
					client.send(message, 0, message.length, setting.port, setting.brokerAdrr, function(err, bytes) {
						if (err){
							console['error'](err);
							connected = false;
							decocb();
						};
						//console['log'](topic + '  ' + txt);
					});		
				}catch(err){
					console['error'](err);
					connected = false;
					decocb();
				}	
			}
			
			if(data.topic == '/LOOP/change' && data.for == clientId){
				changeLoopFreq(data);
			}			
			
		});
		
		client.on('error', function () {
			console['error']('ERROR');
			connected = false;
			decocb();
		});
		
		var msg = {};
		this.publish('/newclient', msg);
		
	};
	
	
	this.publish = function(topic, msg){		
		if(!msg || !topic || !connected){
			return;
		}	
		var tmpErrcb = this.errorStop;			
		
		try {		
			msg.topic = topic;
			msg.from = clientId;
			msg.ip = mip;
			var txt = JSON.stringify(msg);
			var message = new Buffer(txt);			
			client.send(message, 0, message.length, setting.port, setting.brokerAdrr, function(err, bytes) {
				tmpErrcb(err);
			});		
		}catch(err){
			tmpErrcb(err);
		}
		
	};	

	this.publishNoAdd = function(topic, msg){	
		if(!connected){
			return;
		}		
		var tmpErrcb = this.errorStop;	
		
		try {		
			msg.topic = topic;			
			var txt = JSON.stringify(msg);
			var message = new Buffer(txt);			
			client.send(message, 0, message.length, setting.port, setting.brokerAdrr, function(err, bytes) {
				tmpErrcb(err);
			});		
		}catch(err){
			tmpErrcb(err);
		}	
		
	};
	
	
	
	/*************************************************** Custom Loop **********************************************/
	
	var loopCb, loopMin, loopMax, loopCurrent;
	var intervalLoop;
	this.loop = function(min, max, callback) {		
		loopCb = callback;
		loopMin = min;
		loopMax = max;
		loopCurrent = ((max - min)/2) + min;	
		clearInterval(intervalLoop);		
		intervalLoop = setInterval(loopCb, loopCurrent);		
	};
	
	function changeLoopFreq(msg){
		if(msg.freq){
			loopCurrent = msg.freq
			console['warn']("CHANGE LOOP FREQ : ", loopCurrent);			
			clearInterval(intervalLoop);
			intervalLoop = setInterval(loopCb, loopCurrent);			
		}
	}
	
	/*************************************************** Basics function **********************************************/

	this.subscribe = function(msg){		
		switch(msg.topic) {
			case '/SYS/exit':
				if (msg.for.indexof(clientId) > 0 || msg.for == 'all'){
					process.exit(1);
				}
				break;
			default:
				return;
		}
	};	
		
	this.errorStop = function(e){
		if(e){
			console['error'](err);
			connected = false;
			decocb()
			try {
				errorCb(e);
			} catch (e) {}			
		}
	};
	
	this.intervalID = setInterval((function(self) { return function() { 
		self.reconnect();
	}})(this), autoRecoTimeOut);  
 
	this.reconnect = function() {
		if(set && !connected){
			this.setup(myName, setting, cocb, decocb);
		}
	};
	
	this.subscribe = function(topic, callback){	
		subscribed[topic] = callback;	
	};	
	
	this.unsubscribe = function(topic){
		subscribed[topic] = '';	
	};
	
	this.disconnect = function(){
		set = false;
		client.close();
	};	
	
	this.err = function(txt){
		this.publish('/ERROR', {err: txt});
		console['error'](txt);	
	};
	
	this.log = function(txt){
		this.publish('/LOG', {log: txt});
		console['log'](txt);
	};	
	
	this.me = function(){
		return clientId;
	};
	
	this.ip = function(){
		return mip;
	};
	
}

module.exports = mod;
