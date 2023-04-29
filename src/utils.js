var os = require('os');
var net = require('net');


function setId(name) {
	if (!name) name = 'noName';
	let id = name + '-' + Math.random().toString(16).substr(2, 8);
	return id;
}

async function getLocalIp() {
	return new Promise((resolve) => {
		try {
			var socket = net.createConnection(80, 'www.google.com');
			socket.on('connect', function () {
				ip = socket.address().address;
				var hostname = os.hostname();
				socket.end();
				resolve({ ip, hostname });

			});
			socket.on('error', function (e) {
				console.error('Error in socket ' + e);
				resolve({ ip: 'no_ip', hostname: 'no_hostname' });
			});
		} catch (e) {
			console.log('Can\'t get my own IP ' + e);
			resolve({ ip: 'no_ip', hostname: 'no_hostname' });
		}
	});
}

//Parse message
function parseMsg(subscribed, message, remote) {

	//parse
	var msg;
	//console.log(message);
	try {
		var msg = JSON.parse(message);
	} catch (e) {
		console.error('Error in parsing message ' + e);
		return;
	}

	if (!msg.topic) {
		console.error('No topic');
		return;
	}

	if (!msg.from) {
		console.error('No from ID');
		return;
	}

	if (remote) {
		if (remote.address) {
			msg.address = remote.address;
		}
		if (remote.port) {
			msg.port = remote.port;
		}
		/*
		if(remote.id){
			msg.id = remote.id;
		}
		*/
	}
	if (!msg.topic[msg.topic]) {
		msg.topic[msg.topic] = '';
	}
	if (subscribed[msg.topic] && msg.from != id) {
		try {
			subscribed[msg.topic](msg);
		} catch (e) {
			errorCb(e, 0);
		}
	}
	if (subscribed['/CORE/all']) {
		subscribed['/CORE/all'](msg);
	}
	return msg;
}


module.exports = {
	setId,
	getLocalIp,
	parseMsg,
};

