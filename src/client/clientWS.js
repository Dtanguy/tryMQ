const WebSocket = require('ws');
var client;

const init = function (openCb, messageCb, closeCb, errorCb, ip, port) {
	client = new WebSocket('ws://' + ip + ':' + port);
	client.on('open', () => {
		openCb(ip, port);
	});
	client.on('message', messageCb);
	client.on('close', closeCb);
	client.on('error', () => {
		//errorCb
	});
}

function send(data, txt) {
	if (client.readyState != 1) {
		return;
	}
	client.send(txt);
}

module.exports = {
	client: client,
	init: init,
	send: send
};