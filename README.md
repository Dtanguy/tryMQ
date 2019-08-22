# tryMQ

TryMQ is a custom message queue, based on UDP communication.<br>
Modules (clients) are connected to a core (broker) and they exchange JSON messages on topics.

/!\ If you are looking for a stable and reliable message queue, look to existing one like rabbitMQ or ROS.<br>
/!\ TryMQ is made for tests and break things
<p align="center">
	<img src="https://raw.githubusercontent.com/dtanguy/tryMQ/master/img/crash_logo2.png" width="50%">
</p>

I use it for experiment with subjects like distributed architecture, multiple brokers comunication or dynamical load management.
<br>
<br>
You can find compatible modules here : [/url]


# Usage:

## Module (Client side)

UDP message queue client 

```js
var tryMQReq = require('tryMQ');
var tryMQ = new tryMQReq();

var config = {
	port 		: 33333,
	brokerIp 	: '127.0.0.1',
	pswrd 		: 'your_password!'
};

tryMQ.setup('MY_MODULE', config, connected, disconnected);

function connected(adrr){
	console.log('Ready :D');
}

function disconnected(){
	console.log('Disonnected !');
}

// Subscribe '/TOPIC/subtopic' message
mod.subscribe('/TOPIC/subtopic', function (msg) {
	console.log('Receive  : ', msg);
});

setInterval(function(){
	var msg = {data: 'hello !'};
	mod.publish('/TOPIC/subtopic', msg);
}, 1000);
```

## Core (Broker side)

UDP message queue broker

```js
var coreReq = require('./tryMQ/src/core.js');
var core = new coreReq();

var config = {
	portUDP 	: 33333,
	brokerIpUDP : ['127.0.0.1', '192.168.1.17'],
	portWS 		: 8080,
	brokerIpWS 	: '127.0.0.1',
	pswrd 		: 'your_password!'
};

// Start Core
core.setup('CORE', config, coreError);

// Subscribe to all messages
core.subscribe('/CORE/all', function (msg) {
	core.log(msg);
});

// Subscribe '/TOPIC/subtopic' messages
core.subscribe('/TOPIC/subtopic', function (msg) {
	console.log(msg);
});

// In case of error
function coreError(err, code){
	if(code == 0){
		core.warn(err);
	}else{
		core.error(err);
	}
};
```

