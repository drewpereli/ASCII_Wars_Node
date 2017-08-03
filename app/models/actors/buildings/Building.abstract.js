
var Actor = require('../Actor.abstract');

class Building extends Actor{

	constructor(){
		super(arguments[0]);
	}
}

module.exports = Building;