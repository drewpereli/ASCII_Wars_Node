
var Building = require('./Building.abstract');

class CommandCenter extends Building{

	constructor(){
		super(...arguments);
		this.maxHealth = 1000;
	}

	act(){
		
	}
}


module.exports = CommandCenter;