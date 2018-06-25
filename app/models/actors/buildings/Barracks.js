
var Producer = require('./Producer.abstract');

class Barracks extends Producer{
	constructor(args){
		args.name = 'barracks';
		args.readableName = 'Barracks';
		args.character = 'b';
		args.maxHealth = 1000;
		args.producedUnitName = 'Soldier';
		args.productionTime = 10;
		super(args);
	}
}

module.exports = Barracks;