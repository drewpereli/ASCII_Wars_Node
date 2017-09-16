
var Unit = require('./Unit.abstract');
var rand = require('random-seed').create();

class Worker extends Unit {

	constructor(args){
		args.name = 'worker';
		args.readableName = 'Worker';
		args.maxHealth = 100;
		args.moveTime = 1;
		args.defense = 4;
		args.character = 'w';
		super(args);
	}

	getMoveWeight(tile1, tile2){
		return 1;
	}

	act(){
		//this.move(this.tile.siblings[rand.range(this.tile.siblings.length )]);
		this.moveTowardsSquadMovePoint();
	}
}

module.exports = Worker;