
const dgram = require('dgram');

const initUDP = function (port, brokerIp, id, newMessage, upError) {
	var server = dgram.createSocket('udp4');

	server.on('listening', () => {
		var address = server.address();
		console['log']('TryMQ UDP broker listening on ' + address.address + ":" + address.port);
	});

	server.on('message', (message, remote) => {
		var meta = {
			id,
			type: "udp",
			address: remote.address,
			ip: remote.address,
			port: remote.port
		};
		newMessage(message, meta);
	});

	server.on('error', (err) => {
		upError(err, 1);
	});

	server.on('close', () => {
		console['log']('CLOSE UDP');
	});

	server.bind(port, brokerIp);
	return server;
};


module.exports = {
	initUDP: initUDP
};
