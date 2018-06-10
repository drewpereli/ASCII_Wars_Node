
var Producer = require('./Producer.abstract');

class ResidentialArea extends Producer{
	constructor(args){
		args.name = 'residential_area';
		args.readableName = 'Residential Area';
		args.character = 'r';
		args.maxHealth = 1000;
		args.producedUnitName = 'Worker';
		args.productionTime = 10;
		super(args);
	}
}

module.exports = ResidentialArea;