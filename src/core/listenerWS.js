const WebSocketServer = require('ws').Server;

const initWS = function (portWS, brokerIp, id, newMessage, upError) {
	var wss = new WebSocketServer({ port: portWS });
	var server = null;

	wss.on('listening', (ws) => {
		console['log']('TryMQ WS broker listening on ' + brokerIp + ":" + portWS);
	});

	wss.on('connection', (ws, req) => {
		console['log']('TryMQ WS new connection ' + req.connection.remoteAddress + ":" + portWS);
		server = ws;

		server.on('message', (message) => {
			var meta = {
				id,
				type: "ws",
				address: req.connection.remoteAddress.replace('::ffff:', ''),
				ip: req.connection.remoteAddress.replace('::ffff:', ''),
				port: portWS
			};
			newMessage(message, meta);
		});

		server.on('error', (err) => {
			upError(err, 1);
		});

		server.on('close', () => {
			console['log']('CLOSE WS');
		});
	});

	return server;
};

module.exports = {
	initWS: initWS
};