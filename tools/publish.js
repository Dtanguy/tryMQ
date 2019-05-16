var tryMQReq = require('../src/mod.js');
var tryMQ = new tryMQReq();

var config = {
	port 		: 33333,
	brokerIp 	: '127.0.0.1',
	pswrd 		: ''
};

tryMQ.setup('CLI', config.cli, connected, disconnected);

function connected(adrr){
	tryMQ.log('Ready :D');
	if(toSend){
		tryMQ.publish(toSend.topic, toSend)
		console.log('Send : ' + toSend.topic + ' : ' + JSON.stringify(toSend));
		//process.exit();
	}
}

function disconnected(){
	tryMQ.log('Disonnected!');
}


//Parse ARG
//node cli /topic '{"log": "plop"}'
var args = process.argv;
var toSend = {};
if(args.length > 2 && args.length < 5){	
	if(args.length==4){
		try {
			toSend = JSON.parse(args[3]);
		} catch (err) {
			console['error']('Fail parse msg');
			console['error'](err);
			process.exit();
		}
	}
	toSend.topic = args[2];
}else{
	console['error']('Incorrect arguments');
	process.exit();
}