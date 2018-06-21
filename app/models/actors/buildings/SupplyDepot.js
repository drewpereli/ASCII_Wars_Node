
var Building = require('./Building.abstract');

class SupplyDepot extends Building{
	constructor(args){
		args.name = 'supply_depot';
		args.readableName = 'Supply Depot';
		args.character = 's';
		args.maxHealth = 1000;
		args.maxStorage = 10000;
		super(args);
	}

	act(){}
}

module.exports = SupplyDepot;