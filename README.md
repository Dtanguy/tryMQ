# tryMQ

## Client

UDP message queue client 

```js
var modReq = require('tryMQ-client');
var mod = new modReq();

var setting = {
	brokerAdrr : '127.0.0.1',
	port	   : 33333
}

mod.setup('SOMENODE', setting, connected, disconnected);
function connected(){
	mod.log('Connected!');
}
function disconnected(){
	mod.log('Disonnected!');
}


setInterval(function() { 
	var msg = {
		data: 'hello !'
	};
	mod.publish('/TOPIC/subtopic', msg);
}, 1000);


mod.subscribe('/TOPIC2/subtopic2', function (msg) {
	mod.log('I receive that ! : ', msg);
});
```

## Broker

UDP message queue broker

```js
var setting = {
	portUDP 	: 33333,
	brokerIpUDP : ['127.0.0.1', 'ip_of_the_broker'], //Local and external connection
	portWS 		: 8080,
	brokerIpWS 	: '127.0.0.1',
	pswrd 		: 'your_password'
}

// Start and keep core process
var coreReq = require(config.appPath.core);
var core = new coreReq();
core.setup('CORE', setting, coreError);

core.subscribe('/CORE/all', function (msg) {
	core.log(msg);
});

function coreError(err, code){
	if(code == 0){
		core.warn(err);
	}else{
		core.error(err);
		
		if(JSON.stringify(err).indexOf('bind EADDRINUSE')){
			console.warn('AUTO DEBUG /!\\ POTENTIAL RISK OF DATA LOST');
			//Kill node process except me
			/*
			var core = new coreReq();
			core.setup('DEUS', config.core, coreError);
			*/
		}
	}
};
```

