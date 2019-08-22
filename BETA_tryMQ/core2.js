/************************************************ CONFIG & BASE CORE *********************************************/
let color = require('nodeColor');

//Load config file
var config = require('./config2');
if(!config.core || !config.appPath){
	core.error('CONFIG FILE NOT FOUND, USE DEFAULT PARRAMETER');
	process.exit(1);
}

// Start and keep core process
var coreReq = require(config.appPath.core);
var core = new coreReq();
core.setup('CORE2', config.core);

core.subscribe('/CORE/all', function (msg) {
	//console.log(msg);
});

/*
function coreError(err, code){
	if(code == 0){
		console.warn(err);
	}else{
		console.error(err);
		
		if(JSON.stringify(err).indexOf('bind EADDRINUSE')){
			console.warn('AUTO DEBUG /!\\ POTENTIAL RISK OF DATA LOST');
			//Kill node process except me
			
			//var core = new coreReq();
			//core.setup('DEUS', config.core, coreError);
			
		}
	}
};
*/