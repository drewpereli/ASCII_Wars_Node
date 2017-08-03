
var Unit = require('./Unit.abstract');
var rand = require('random-seed').create();

class Worker extends Unit {

	constructor(){
		arguments[0].name = 'worker';
		arguments[0].readableName = 'Worker';
		arguments[0].maxHealth = 100;
		arguments[0].moveTime = 1;
		arguments[0].defense = 4;
		arguments[0].character = 'w';
		super(...arguments);
	}

	getMoveWeight(tile1, tile2){
		return 1;
	}

	act(){
		this.move(this.tile.siblings[rand.range(this.tile.siblings.length )]);
	}
}

module.exports = Worker;