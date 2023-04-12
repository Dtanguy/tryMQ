var path = "";

var config = {
	appPath: {
		libs: path + 'libs',
		root: path + 'DOTSystem',
		cli: path + 'libs/tryMQ/src/mod.js',
		core: path + 'libs/tryMQ/src/core.js',
		modules: path + 'DOTModules',
	},
	core: {
		portUDP: 33333,
		brokerIpUDP: ['127.0.0.1', ''],
		portWS: 8080,
		brokerIpWS: '127.0.0.1',
		pswrd: 'admin'
	},
	cli: {
		type: 'UDP', // UDP or WS
		port: 33333,
		brokerIp: '',
		pswrd: 'admin'
	},
	meta: {}
};

module.exports = config;