# tryMQ

TryMQ is a custom message queue, based on UDP comunication.
Modules (clients) are connected to a core (broker) and they exchange JSON messages on topics.

/!\ If you are looking for a stable and reliable message queue, you better gotta look to existing message queue like rabbitMQ or ROS.
<p align="center">
	<img src="https://raw.githubusercontent.com/dtanguy/tryMQ/img/crash_logo2.png" width="60%">
</p>


I made this for experiment with subjects like distributed architecture, multiple brokers comunication, dynamical load management..


# Usage:

## Module (Client side)

UDP message queue client 

```js
var modReq = require('tryMQ-client');
var mod = new modReq();

var setting = {
	brokerAdrr : '127.0.0.1',
	port	   : 33333
}

mod.setup('MY_MODULE', setting, connected, disconnected);
function connected(){
	console.log('Connected!');
}
function disconnected(){
	console.log('Disonnected!');
}


setInterval(function() { 
	var msg = {
		data: 'hello !'
	};
	mod.publish('/TOPIC/subtopic', msg);
}, 1000);


mod.subscribe('/TOPIC2/subtopic2', function (msg) {
	console.log('I receive that ! : ', msg);
});
```

## Core (Broker side)

UDP message queue broker

```js
var setting = {
	portUDP 	: 33333,
	brokerIpUDP	: ['127.0.0.1', 'ip_of_the_broker'],
	portWS 		: 8080,
	brokerIpWS 	: '127.0.0.1',
	pswrd 		: 'your_password'
}

// Start and keep core process
var coreReq = require(config.appPath.core);
var core = new coreReq();
core.setup('CORE', setting, coreError);

// Every message end here
core.subscribe('/CORE/all', function (msg) {
	console.log(msg);
});

// Only '/TOPIC/subtopic' message here
core.subscribe('/TOPIC/subtopic', function (msg) {
	console.log(msg);
});

function coreError(err, code){
	if(code == 0){
		console.warn(err);
	}else{
		console.error(err);
	}
};
```

