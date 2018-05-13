
var Actor = require('../Actor.abstract');

class Building extends Actor{

	constructor(args){
		args.type = 'building';
		super(args);
	}
}

module.exports = Building;