
var Building = require('./Building.abstract');

class Wall extends Building{

	constructor(args){
		args.name = 'water_pump';
		args.readableName = 'Water Pump';
		args.maxHealth = 1000;
		args.direction = 0;
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
	}
}


module.exports = Wall;