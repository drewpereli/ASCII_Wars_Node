
var Building = require('./Building.abstract');

class SupplyDepot extends Building{
	constructor(args){
		args.name = 'supply_depot';
		args.readableName = 'Supply Depot';
		args.character = 's';
		args.maxHealth = 1000;
		super(args);
		this.stored = {
			food: 0,
			ammo: 0
		};
	}
}

module.exports = SupplyDepot;