let color = require('nodeColor');

var config = require('./config2');
var tryMQReq = require(config.appPath.cli);

var tryMQ = new tryMQReq();
tryMQ.setup('M3', config.cli, connected, disconnected);

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
	tryMQ.publish('/test3', {});
}, 2000);