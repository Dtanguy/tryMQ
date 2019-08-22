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