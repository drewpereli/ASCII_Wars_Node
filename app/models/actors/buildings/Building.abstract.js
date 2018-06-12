
var Actor = require('../Actor.abstract');

class Building extends Actor{

	constructor(args){
		args.type = 'building';
		args.acting = true;
		super(args);
	}

	setOnOff(buildingOn){
		this.acting = buildingOn;
	}
}

module.exports = Building;