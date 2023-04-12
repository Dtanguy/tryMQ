const WebSocket = require('ws');
var client;

const init = function (openCb, messageCb, closeCb, errorCb) {
	client = new WebSocket('ws://');
	client.on('open', () => {
		openCb(client._socket.remoteAddress, client._socket.remotePort);
	});
	client.on('message', messageCb);
	client.on('close', closeCb);
	client.on('error', errorCb);
}

function send(data, txt) {
	client.send(txt);
}

module.exports = {
	client: client,
	init: init,
	send: send
};