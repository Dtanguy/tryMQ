function mod() {
	
	var dgram = require('dgram');
	var shared = require('./shared');
	
	//Golbal (default setting)
	var setting = {
		brokerIp : '127.0.0.1',
		port	 : 33333,
		pswrd	 : ''
	};
	
	var verbose = true;	
	var set = false;
	
	//Network and subscribtion
	var client;	
	var coCb, decoCb, errorCb;
	var autoRecoTimeOut = 2000;
	var token = -1;
	var lastPing = -1;
	var timeOut = 5000;

	//Initialize a client
	this.setup = function(id, sett, coCb_, decoCb_, errorCb_) {
	
		set = true;
		if(sett){
			if(sett.brokerIp){
				setting.brokerIp = sett.brokerIp;
			}
			if(sett.port){
				setting.port = sett.port;
			}
			if(sett.pswrd){
				setting.pswrd = sett.pswrd
			}
		}
		
		//Set callback		
		coCb = coCb_;
		decoCb = decoCb_;	
		errorCb = errorCb_;
		shared.init(id, upError, send);
		shared.log('ID: ' + shared.id());	
		//shared.setCo(true);
		lastPing = Date.now();
		
		client = dgram.createSocket('udp4');
		shared.log('Connecting to ' + setting.brokerIp + ':' + setting.port + ' .. ');		
		
		client.on('listening', () => {
			shared.setCo(true);
			shared.log('UDP: ' + client.address().address + ':' + client.address().port + ', Autentification..');
			shared.publish('/login', {pswrd: setting.pswrd});
			setTimeout(function(){
				if(token == -1){
					shared.log('Fail Auth.. Please verify password configuration');
				}
			}, 5000);
		});
		
		//Incoming messages
		client.on('message', (message, remote) => {
			lastPing = Date.now();
			var data = shared.incomingMsg(message, remote);
			if(!data){
				return;
			}
			
			//Direct order	
			if(data.topic == '/login' && data.token){
				token = data.token;
				shared.log('Succes ! token : '  + data.token);
				coCb(client.address());
			}
			if(data.topic == '/invalid'){
				shared.publish('/login', {pswrd: setting.pswrd});
			}		
			if(data.topic == '/CORE/ping' && data.ask==true){
				//shared.publish('/CORE/ping', {});
				this.publish('/CORE/ping', {});
			}			
			if(data.topic == '/LOOP/change' && data.for && data.for == shared.id()){
				changeLoopFreq(data);
			}
			if(data.topic == '/CORE/exit' && data.for && data.for == shared.id()) {
				process.exit(1);
			}
			
		});
		
		//Connection error
		client.on('error', (e) => {
			upError(e, 1);
		});
		
		//shared.publish('/', {});
		client.bind();
	};
	
	
	//Specifique send instruction
	function send(data, txt){
		var message = new Buffer.alloc(txt.length, txt);			
		client.send(message, 0, message.length, setting.port, setting.brokerIp, function(err, bytes) {
			//The message have been send
		});	
	}
	
	//Centralise error flag andup them
	function upError(err, code){
		if (!err) {
			errorCb('Error, no error.. -_-"', 0);
			return;
		}
		if(errorCb){
			errorCb(err, code);
		}else{
			if(code == 0){
				shared.warn(err);
			}else{
				shared.error(err);
			}
		}
	};
	
	
	
	//Disconnect client
	this.disconnect = function(){
		set = false;
		client.close();
	};	
	
		
	//Automatic reconnection
	this.intervalID = setInterval((function(self) { return function() { 
		self.reconnect();
	}})(this), autoRecoTimeOut);  
 
	this.reconnect = function() {
		if(set && !shared.getCo()){
			this.setup(shared.name(), setting, coCb, decoCb);
		}
		if( (Date.now()-lastPing) > timeOut){
			//shared.warn('Timeout..');
			upError('Timeout..', 0);
			this.setup(shared.name(), setting, coCb, decoCb);
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
			shared.warn("CHANGE LOOP FREQ : ", loopCurrent);			
			clearInterval(intervalLoop);
			intervalLoop = setInterval(loopCb, loopCurrent);			
		}
	};

	
	
	/***************************************** SHARED **********************************************/
	
	this.publish = function(topic, msg){	
		msg.token = token;
		return shared.publish(topic, msg);
	};
	
	this.subscribe = function(topic, callback){	
		return shared.subscribe(topic, callback);	
	};	
	
	this.unsubscribe = function(topic){
		return shared.unsubscribe(topic);	
	};
 	
	this.error = function(txt) {
		return shared.error(txt);	
	};
	
	this.warn = function(txt) {
		return shared.warn(txt);	
	};
	
	this.log = function(txt) {
		return shared.log(txt);
	};	
	
	this.name = function() {
		return shared.name();
	};	
	
	this.id = function() {
		return shared.id();
	};
	
	this.hostname = function() {
		return shared.hostname();
	};
	
	this.ip = function() {
		return shared.ip();
	};
	
}
module.exports = mod;