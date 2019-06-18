var tryMQReq = require('../src/mod.js');
var tryMQ = new tryMQReq();

var config = {
	port 		: 33333,
	brokerIp 	: '127.0.0.1',
	pswrd 		: ''
};

tryMQ.setup('CLI', config, connected, disconnected);

function connected(adrr){
	tryMQ.log('Ready :D');
	main();
}

function disconnected(){
	tryMQ.log('Disonnected!');
}




/*
Parse ARG :
	DONE
	(node cli) pub /topic/subtopic '{"log": "plop"}' interval
	(node cli) sub /topic/subtopic
	(node cli) all
	
	TODO
	(node cli) -h
	(node cli) topics -l
	(node cli) module -l
*/

function nop_error(str){
	console['error'](str);
	process.exit();
}

function main(){
	var args = process.argv;
	var toSend = {};
	
	if(args.length < 3){
		nop_error('Too few arguments');
	}
	
	if(args[2] == 'pub' && args.length == 5){
		// (node cli) pub /topic/subtopic '{"log": "plop"}'
		var topic = args[3];		
		var toSend = {};
		try {
			toSend = JSON.parse(args[4]);
		} catch (err) {
			nop_error('Pub simple fail parse msg');				
		}
		tryMQ.publish(topic, toSend);
		console.log('');
		console.log(Date.now() + ' => ' + toSend.topic);
		console.log(JSON.stringify(toSend, null, 4));
		setTimeout(function(){
			process.exit();
		}, 500);
		
	}else if(args[2] == 'pub' && args.length == 6){
		// (node cli) pub /topic/subtopic '{"log": "plop"}' interval
		var topic = args[3];		
		var toSend = {};
		try {
			toSend = JSON.parse(args[4]);
		} catch (err) {
			nop_error('Pub interval fail parse msg');				
		}
		var delay = args[5];
		setInterval(function(){
			tryMQ.publish(topic, toSend);
			console.log('');
			console.log(Date.now() + ' => ' + toSend.topic);
			console.log(JSON.stringify(toSend, null, 4));
		}, delay);
		
	}else if(args[2] == 'sub' && args.length == 4){		
		// (node cli) sub /topic/subtopic
		var topic = args[3];	
		tryMQ.subscribe(topic, function (msg) {
			console.log('');
			console.log('<= ' + toSend.topic);
			console.log(JSON.stringify(msg, null, 4));
		});
		
	}else if(args[2] == 'all' && args.length == 3){
		// (node cli) all
		tryMQ.subscribe('/CORE/all', function (msg) {
			console.log('');
			console.log('<= ' + msg.topic);
			console.log(JSON.stringify(msg, null, 4)); 
		});
		
	}else{
		nop_error('Incorrect arguments');
	}

}


