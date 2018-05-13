
var Building = require('./Building.abstract');

class Wall extends Building{

	constructor(args){
		args.name = 'water_pump';
		args.readableName = 'Water Pump';
		args.maxHealth = 1000;
		super(args);
		this.direction = args.direction;
		switch (this.direction){
			case 0: 
				this.character = '\u21e1';
				break;
			case 1: 
				this.character = '\u21e2';
				break;
			case 2: 
				this.character = '\u21e3';
				break;
			case 3:
				this.character = '\u21e0';
				break;
		}
	}

	act(){
		if (!this.tile.hasWater()) return;
		var receiver = this.tile.siblings[2 * this.direction];
		this.tile.prepareToLoseWater();
		receiver.prepareToGainWater();
	}
}


module.exports = Wall;