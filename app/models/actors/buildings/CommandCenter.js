
var Building = require('./Building.abstract');

class CommandCenter extends Building{

	constructor(){
		this.maxHealth = 1000;
		super.constructor(...arguments);
	}

	act(){
		
	}
}


module.exports = CommandCenter;