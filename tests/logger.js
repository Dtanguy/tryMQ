[
	['warn', '\x1b[35m'],
	['error', '\x1b[31m'],
	['log', '\x1b[2m']
].forEach(function (pair) {
	var method = pair[0], reset = '\x1b[0m', color = '\x1b[36m' + pair[1];
	console[method] = console[method].bind(console, color, method.toUpperCase(), reset);
});
