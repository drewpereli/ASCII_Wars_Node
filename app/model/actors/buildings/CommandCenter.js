
var Building = require('./Building');

class CommandCenter extends Building{

	constructor(){
		this.maxHealth = 1000;
		super.constructor(...arguments);
	}
}