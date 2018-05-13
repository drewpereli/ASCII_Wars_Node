
var Building = require('./Building.abstract');

class WaterPump extends Building{

	constructor(args){
		args.maxHealth = 1000;
		switch (args.direction){
			case 0: 
				args.character = '\u21e1';
				break;
			case 1: 
				args.character = '\u21e2';
				break;
			case 2: 
				args.character = '\u21e3';
				break;
			case 3:
				args.character = '\u21e0';
				break;
		}
		super(args);
	}

	act(){
		if (!this.tile.hasWater()) return;
		var receiver = this.tile.siblings[2 * this.direction];
		this.tile.prepareToLoseWater();
		receiver.prepareToGainWater();
		//If receiver has a higher elevation than this.tile, add the difference to time until next action
		this.timeUntilNextAction = Math.abs(receiver.getSurfaceElevation() - this.tile.getSurfaceElevation());
	}

	static canOccupy(tile){
		return !tile.isOccupied();
	}
}

module.exports = WaterPump;