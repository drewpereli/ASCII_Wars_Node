
var Building = require('./Building.abstract');

class Wall extends Building{

	constructor(args){
		args.name = 'wall';
		args.readableName = 'Wall';
		args.character = 'w';
		args.maxHealth = 1000;
		super(args);
	}

	act(){
		
	}
}


module.exports = Wall;