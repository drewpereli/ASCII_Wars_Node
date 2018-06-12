
var Model = require('../Model.abstract');

class Squad extends Model{
	constructor(args){
		super();
		this.number = args.squadNumber;
		this.units = [];
		this.behaviorParams = {
			behavior: 'attacking',
			movingTo: null,
			moveTowardsPointWeight: 1,
			moveTowardsSquadMatesWeight: 1,
			alignment: false,
			alignmentWeight: 2,
			diggingDirection: 0,
			resourceHarvested: 'wood',
		};
	}

	setBehaviorParams(params){
		Object.assign(this.behaviorParams, params);
	}

	getBehaviorParams(){
		return this.behaviorParams;
	}
}

module.exports = Squad;