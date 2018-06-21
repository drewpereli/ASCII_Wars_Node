
var Actor = require('../Actor.abstract');
var config = require('../../../../config');

class Building extends Actor{

	constructor(args){
		args.type = 'building';
		args.storing = {};
		args.acting = true;
		if (!args.maxStorage) args.maxStorage = 0;
		super(args);
		this.clientFacingFields.push('storing');
	}

	setOnOff(buildingOn){
		this.acting = buildingOn;
	}

	getTotalStored(){
		var stored = 0;
		for (var resource in this.storage){
			stored += this.storage[resource];
		}
		return stored;
	}

	getRemainingStorage(){
		var totalStored = this.getTotalStored();
		if (totalStored > this.maxStorage) throw new Error('Total storage (' + args.storing.length + ') is greater than max storage (' + this.maxStorage + ')');
		return this.maxStorage - totalStored;
	}

	addStorage(resource){
		if (!config.model.map.resourceTypes.includes(resource)) throw new Error('Resource ' + resource + ' not in list of resources in config');
		if (this.getRemainingStorage() <= 0) return false;
		if (this.isStoring(resource)) this.storing[resource]++;
		else this.storing[resource] = 1;
		return true;
	}

	removeStorage(resource){
		if (!this.isStoring(resource)) return false;
		this.storing[resource]--;
		return true;
	}

	isStoring(resource){
		return this.storing[resource] > 0;
	}


}

module.exports = Building;