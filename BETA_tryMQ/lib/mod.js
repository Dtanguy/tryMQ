function mod() {
	
	let dgram = require('dgram');
	let sharedFunction = require('./sharedFunction');
	
	//Golbal (default setting)
	let setting = {
		brokerIp : '127.0.0.1',
		port	 : 33333,
		pswrd	 : ''
	};
	
	let verbose = true;	
	//let set = false;
	
	let linkMaster = {
		brokerIp 		: -1,
		port	 		: -1,
		pswrd	 		: '',
		set		 		: false,
		connected		: false,
		//uid		 		: crypto.randomBytes(8).toString('hex'),
		autoRecoTimeOut	: 2000,
		lastPing 		: -1,
	    timeOut 		: 5000,
	};
	
	//Network and subscribtion
	let client;	
	let coCb, decoCb, errorCb;
	let token = -1;
	
	let workingData = {
		name       : -1,
		id         : -1,
		hostname   : -1,
		ip         : -1,
		subscribed : {},
		startTime  : Date.now()
	};

	//Initialize a client
	this.setup = function(name_, sett, coCb_, decoCb_, errorCb_) {
	
		linkMaster.set = true;
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
		
		var res;
		if(workingData.id != -1){
			res = sharedFunction.loadParam(name_, workingData.id);
		}else{
			res = sharedFunction.loadParam(name_);
		}
		workingData = Object.assign(workingData, res);

		linkMaster.lastPing = Date.now();
		
		client = dgram.createSocket('udp4');
		console.log('Connecting to ' + setting.brokerIp + ':' + setting.port + ' .. ');		
		
		client.on('listening', () => {
			linkMaster.connected = true;
			console.log('UDP: ' + client.address().address + ':' + client.address().port + ', Autentification..');
			sharedFunction.publish('/login', {pswrd: setting.pswrd}, workingData, send, errorCb);
			setTimeout(function(){
				if(token == -1){
					console.log('Fail Auth.. Please verify password configuration');
				}
			}, 5000);
		});
		
		//Incoming messages
		client.on('message', (message, remote) => {
			linkMaster.lastPing = Date.now();
			let data = sharedFunction.incomingMsg(message, remote, workingData, errorCb);		
			if(!data){
				return;
			}
			
			//sharedFunction.auto_cmd(data, workingData, token, send, errorCb);
			
			
			//Direct order	
			if(data.topic == '/login' && data.token){
				token = data.token;
				console.log('Succes ! token : '  + data.token);
				coCb(client.address());
			}
			if(data.topic == '/invalid'){
				sharedFunction.publish('/login', {pswrd: setting.pswrd}, workingData, send, errorCb);
			}		
			if(data.topic == '/CORE/ping' && data.ask==true){
				//console.log("send back ping " + data.from);
				this.publish('/CORE/ping', {rep: true});
			}			
			if(data.topic == '/LOOP/change' && data.for && data.for == workingData.id){
				changeLoopFreq(data);
			}
			if(data.topic == '/CORE/exit' && data.for && data.for == workingData.id) {
				process.exit(1);
			}
			
		});
		
		//Connection error
		client.on('error', (e) => {
			errorCb(e, 1);
		});
		
		client.bind();
	};
	
	
	//Specifique send instruction
	function send(data){
		let txt = JSON.stringify(data);
		let message = new Buffer.alloc(txt.length, txt);			
		client.send(message, 0, message.length, setting.port, setting.brokerIp, function(err, bytes) {
			//The message have been send
		});	
	}

	
	//Disconnect client
	this.disconnect = function(){
		linkMaster.set = false;
		client.close();
	};	
	
		
	//Automatic reconnection
	this.intervalID = setInterval((function(self) { return function() { 
		self.reconnect();
	}})(this), linkMaster.autoRecoTimeOut);  
 
	this.reconnect = function() {
		if(linkMaster.set && !linkMaster.connected){
			this.setup(name, setting, coCb, decoCb);
		}/*
		if( (Date.now()-linkMaster.lastPing) > linkMaster.timeOut){
			//console.warn('Timeout..');
			errorCb('Timeout..', 0);
			this.setup(name, setting, coCb, decoCb);
		}*/
	};

	
	
	/*************************************************** Custom Loop **********************************************/
	
	let loopCb, loopMin, loopMax, loopCurrent;
	let intervalLoop;
	
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
			console.warn("CHANGE LOOP FREQ : ", loopCurrent);			
			clearInterval(intervalLoop);
			intervalLoop = setInterval(loopCb, loopCurrent);			
		}
	};

	
	
	/***************************************** SHARED **********************************************/
	
	this.publish = function(topic, msg, add){	
		msg.token = token;
		return sharedFunction.publish(topic, msg, workingData, send, errorCb, add);
	};
	
	this.subscribe = function(topic, callback){	
		return sharedFunction.subscribe(topic, callback, workingData);	
	};	
	
	this.unsubscribe = function(topic){
		return sharedFunction.unsubscribe(topic, workingData);	
	};
	
	this.name = function() {
		return name;
	};	
	
	this.id = function() {
		return id;
	};
	
	this.hostname = function() {
		return hostname;
	};
	
	this.ip = function() {
		return ip;
	};
	
}

module.exports = mod;