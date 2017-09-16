
var Unit = require('./Unit.abstract');

class Infantry extends Unit {

	constructor(args){
		args.maxHealth = 100;
		args.moveTime = 10;
		args.damage = 10;
		args.range = 5;
		args.accuracy = 5;
		args.defense = 4;
		args.armor = 0;
		args.fireTime = 5;
		super.constructor(args);
	}

	getMoveWeight(tile1, tile2){
		return 1;
	}
}

module.exports = Infantry;