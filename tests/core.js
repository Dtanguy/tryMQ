const config = require('./config.js');
const logger = require('./logger.js');
const core = require('../src/core/core.js');

// Start Core
core.setup('CORE', config.core, coreError);

// Subscribe to all messages
core.subscribe('/CORE/all', function (msg) {
	console.log(msg);
});

// Subscribe '/TOPIC/subtopic' messages
core.subscribe('/TOPIC/subtopic', function (msg) {
	console.log(msg);
});

// In case of error
function coreError(err, code) {
	if (code == 0) {
		console.warn(err);
	} else {
		console.error(err);
	}
};
