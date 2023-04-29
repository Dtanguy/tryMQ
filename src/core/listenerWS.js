const WebSocketServer = require('ws').Server;
var crypto = require('crypto');


const initWS = function (portWS, brokerIp, id_, newMessage, upError, add) {
	var wss = new WebSocketServer({ port: portWS });


	wss.on('listening', (ws) => {
		console.log('TryMQ WS broker listening on ' + brokerIp + ":" + portWS);
	});

	wss.on('connection', (ws, req) => {
		var id = crypto.randomBytes(8).toString('hex');
		let ip = req.connection.remoteAddress.replace('::ffff:', '');
		console.log('TryMQ WS new connection ' + ip + ":" + portWS);
		add({ id, ws });
		ws.on('message', (message) => {
			var meta = {
				id: id,
				type: "ws",
				address: ip,
				ip: ip,
				port: portWS
			};
			newMessage(message, meta);
		});

		ws.on('error', (err) => {
			//upError(err, 1);
		});

		ws.on('close', () => {
			console.log('CLOSE WS');
		});
	});

	//return wss;
};

module.exports = {
	initWS: initWS
};