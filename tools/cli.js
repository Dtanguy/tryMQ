var tryMQReq = require('../src/mod.js');
var tryMQ = new tryMQReq();

var config = {
	port 		: 33333,
	brokerIp 	: '127.0.0.1',
	pswrd 		: 'yolo!'
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
	(node cli) topic -l
	(node cli) module -l
	
	TODO
	add /*
	(node cli) -h
	debug module ping ?
	/CORE/topic (timeout)
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
			console.log('<= ' + topic);
			console.log(JSON.stringify(msg, null, 4));
		});
		
	}else if(args[2] == 'all' && args.length == 3){
		// (node cli) all
		tryMQ.subscribe('/CORE/all', function (msg) {
			console.log('');
			console.log('<= ' + msg.topic);
			console.log(JSON.stringify(msg, null, 4)); 
		});
		
	}else if(args[2] == 'module' && args[3] == '-l' && args.length == 4){
		// ((node cli) module -l		
		
		var list = {};
		tryMQ.subscribe('/CORE/ping', function (msg) {
			//if(!list[msg.from]){
				//list[msg.from] = {};
				console.log(Date.now() + ' - ' + msg.from);
			//}
		});		
		
		setTimeout(function(){
			console.log('');
			console.log('Ask for ping :');
			tryMQ.publish('/CORE/ping', {'ask': true});
		}, 1000);		
		
		
		setTimeout(function(){
			process.exit();
		}, 10000);
		
		}else if(args[2] == 'topic' && args[3] == '-l' && args.length == 4){
		// ((node cli) topic -l		
		
		var list = {};
		tryMQ.subscribe('/CORE/all', function (msg) {
			if(!list[msg.topic]){
				list[msg.topic] = {};
				console.log(Date.now() + ' ' + msg.topic);
			}			
		});		
		
		setTimeout(function(){
			process.exit();
		}, 10000);
		
	}else{
		nop_error('Incorrect arguments');
	}

}


