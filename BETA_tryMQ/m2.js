let color = require('./nodeColor');

var config = require('./config1');
var tryMQReq = require(config.appPath.cli);

var tryMQ = new tryMQReq();
tryMQ.setup('M2', config.cli, connected, disconnected);

function connected(adrr){
	console.log('Ready :D');
}
 
function disconnected(){
	console.log('Disonnected !');
}

tryMQ.subscribe('/CORE/all', function (msg) {
	console.log(msg);
});

setInterval(function(){
	tryMQ.publish('/test2', {});
}, 2000);
