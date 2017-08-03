
var Actor = require('../Actor.abstract');

class Unit extends Actor{

	constructor(){
		super(...arguments);
	}

	move(tile){
		this.tile.setActor(false);
		this.tile = tile;
		tile.setActor(this);
		this.timeUntilNextAction = this.moveTime;
	}
}

module.exports = Unit;