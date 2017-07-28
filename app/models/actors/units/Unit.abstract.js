
var Actor = require('../Actor.abstract');

class Unit extends Actor{

	constructor(){
		super.constructor(...arguments);
	}
}

module.exports = Actor;