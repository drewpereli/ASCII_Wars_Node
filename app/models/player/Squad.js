
var Model = require('../Model.abstract');

class Squad extends Model{
	constructor(args){
		super();
		this.number = args.squadNumber;
		this.units = [];
		this.behaviorParams = {
			movingTo: null,
			moveTowardsPointWeight: 1,
			moveTowardsSquadMatesWeight: 1,
			alignment: 'E-W',
			alignmentWeight: 2,
			digging: false,
			diggingDirection: 0
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