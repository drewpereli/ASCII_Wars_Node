
var Building = require('./Building.abstract');

class CommandCenter extends Building{

	constructor(){
		arguments[0].name = 'command_center';
		arguments[0].readableName = 'Command Center';
		arguments[0].character = 'c';
		arguments[0].maxHealth = 1000;
		super(arguments[0]);
	}

	act(){
		
	}
}


module.exports = CommandCenter;