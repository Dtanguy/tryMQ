# tryMQ-client

UDP message queue client


```
var modReq = require('tryMQ-client');
var mod = new modReq();

mod.setup('SOMENODE', '127.0.0.1', connected, disconnected);
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