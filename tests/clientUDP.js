const logger = require('./logger.js');
const tryMQ = require('../src/client/client.js');

const config = {
	type: 'UDP',
	port: 33333,
	brokerIp: '127.0.0.1',
	pswrd: 'admin'
};

function connected() {
	console.log('Ready :D');
}

function disconnected() {
	console.log('Disonnected !');
}

function error(err) {
	console.error(err)
}

tryMQ.setup('M2', config, connected, disconnected, error);

tryMQ.subscribe('/CORE/all', function (msg) {
	console.log(msg);
});

setInterval(function () {
	tryMQ.publish('/test', {});
}, 2000);