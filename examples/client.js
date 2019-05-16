var tryMQReq = require('../src/mod.js');
var tryMQ = new tryMQReq();

var config = {
	port 		: 33333,
	brokerIp 	: '127.0.0.1',
	pswrd 		: 'hey!'
};

tryMQ.setup('EXAMPLE', config, connected, disconnected);

function connected(adrr){
	tryMQ.log('Ready :D');
}

function disconnected(){
	tryMQ.log('Disonnected !');
}

tryMQ.subscribe('/hey', function (msg) {
	tryMQ.log(msg); 
});


// Publish on /blabla every second
setInterval(function(){
	var to_send = {msg: "plop !"};
	tryMQ.publish('/blabla', to_send);
}, 1000);