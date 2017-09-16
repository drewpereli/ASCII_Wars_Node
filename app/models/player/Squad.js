
var Model = require('../Model.abstract');

class Squad extends Model{
	constructor(args){
		super();
		this.number = args.squadNumber;
		this.units = [];
		this.behaviorParams = {
			movingTo: null
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