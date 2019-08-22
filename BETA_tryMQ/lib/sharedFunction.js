// Load param
function loadParam(name_, id_ori){
	let os = require('os');	

	if(name_ != ''){
		name = name_;
	}else{
		name = 'noName';
	}
	
	var id_;
	if(id_ori){
		id_ = id_ori;
	}else{
		id_ = name + '-' + Math.random().toString(16).substr(2, 8);	
	}
	
	var ifaces = os.networkInterfaces();
	var ip_ = -1;
	Object.keys(ifaces).forEach(function (ifname) {
		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family || iface.internal !== false) {
				return;
			}
			ip_ = iface.address;
		});
	});
	
	console.log("Started " + '\x1b[32m' + id_ + '\x1b[36m');

	return {
		id: 		id_,
		hostname: 	os.hostname(),
		ip:			ip_,
		startTime:  Date.now()
	};
}



//Parse message
function incomingMsg(message, remote, workingData, errorCb){
		
	//parse
	let msg = {};
	try{
		msg = JSON.parse(message);
	}catch(err){
		errorCb('Error JSON.pase fail', 0);
		return;
	}
		
	// Is there topic and from ?
	if (!msg.topic){
		errorCb('No topic', 0);
		return;
	}		
	if (!msg.from){
		errorCb('No from ID', 0);
		return;
	}
	
	// If it's me ?!
	if(msg.from == workingData.id){
		errorCb('Speak to myself, something weird is going one', 0);
		return;
	}
		
	if(remote.address){
		msg.address = remote.address;
	}
	if(remote.port){
		msg.port = remote.port;
	}
	
	if (!msg.topic[msg.topic]){
		msg.topic[msg.topic] = '';
	}
	
	if(workingData.subscribed[msg.topic] && msg.from != workingData.id){				
		try {
			workingData.subscribed[msg.topic](msg);
		} catch (e) {
			errorCb(e, 0);
		}
	}			
	if(workingData.subscribed['/CORE/all']){
		workingData.subscribed['/CORE/all'](msg);
	}

	return msg;
};



function auto_cmd(msg, workingData, token, send, errorCb){
	/*
	// login
	if(msg.topic == '/login' && msg.token){
		token = msg.token;
		console.log('Succes ! token : '  + msg.token);
		//coCb(client.address());
	}	
	if(msg.topic == '/invalid'){
		publish('/login', {pswrd: setting.pswrd}, workingData, send, errorCb);
	}		
	
	// commandes
	if(msg.topic == '/CORE/ping' && msg.ask==true){
		publish('/CORE/ping', {rep: true}, workingData, send, errorCb);
	}			
	if(msg.topic == '/LOOP/change' && msg.for && msg.for == workingData.id){
		//changeLoopFreq(msg);
	}
	if(msg.topic == '/CORE/exit' && msg.for && msg.for == workingData.id) {
		process.exit(1);
	}	
	*/
	return msg;
};


function publish(topic, msg, param, send, errorCb, add){	
		
	if(!msg || !topic){			
		return;
	}

	try {
		delete msg.port;
		delete msg.address;
		msg.topic = topic;
		
		if(!msg.path){
			msg.path = [];
		}
		msg.path.push(param.id);
		
		if(!msg.from){
			msg.from = param.id;
			msg.hostname = param.hostname;
			msg.ip = param.ip;
		}

		send(msg);					
	}catch(e){
		errorCb(e, 0);
	}
};



function subscribe(topic, callback, workingData){	
	if(!topic || !callback){
		return;
	}
	workingData.subscribed[topic] = callback;	
};	
	
	
	
function unsubscribe(topic, workingData){
	workingData.subscribed[topic] = '';	
};



function upTime(workingData){
	return Date.now() - workingData.startTime;
};
	
	
module.exports.loadParam = loadParam;
module.exports.incomingMsg = incomingMsg;
module.exports.auto_cmd = auto_cmd;
module.exports.publish = publish;
module.exports.subscribe = subscribe;
module.exports.upTime = upTime;
