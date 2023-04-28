var path = "";

var config = {
	core: {
		portUDP: 33333,
		brokerIpUDP: ['127.0.0.1', ''],
		portWS: 8080,
		brokerIpWS: '127.0.0.1',
		pswrd: 'admin'
	},
	cli: {
		type: 'WS', // UDP or WS
		port: 8080, //33333,
		brokerIp: '127.0.0.1',
		pswrd: 'admin'
	},
	meta: {}
};

module.exports = config;