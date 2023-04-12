const config = require('./config.js');
const logger = require('./logger.js');
const tryMQ = require('../src/client/client.js');

function connected() {
	console.log('Ready :D');
}

function disconnected() {
	console.log('Disonnected !');
}

function error(err) {
	console.error(err)
}

tryMQ.setup('M1', config.cli, connected, disconnected, error);

tryMQ.subscribe('/CORE/all', function (msg) {
	console.log(msg);
});

setInterval(function () {
	tryMQ.publish('/test', {});
}, 2000);