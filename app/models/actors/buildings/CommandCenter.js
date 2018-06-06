
var Building = require('./Building.abstract');

class CommandCenter extends Building{

	constructor(){
		arguments[0].name = 'command_center';
		arguments[0].readableName = 'Command Center';
		arguments[0].character = 'c';
		arguments[0].maxHealth = 1;
		super(arguments[0]);
	}

	act(){
		
	}

	die(){
		super.die();
		this.game.killPlayer(this.player);
	}
}


module.exports = CommandCenter;