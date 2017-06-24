
var Unit = require('./Unit');

class Infantry exends Unit {

	constructor(){
		this.maxHealth = 100;
		this.moveTime = 10;
		this.damage = 10;
		this.range = 5;
		this.accuracy = 5;
		this.defense = 4;
		this.armor = 0;
		this.fireTime = 5;
		super.constructor(...arguments);
	}

	getMoveWeight(tile1, tile2){
		return 1;
	}
}