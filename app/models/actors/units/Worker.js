
var Unit = require('./Unit.abstract');

class Worker extends Unit{
	constructor(args){
		args.character = 'w';
		args.name = 'worker';
		super(args);
	}


	act(){
		var behaviorParams = this.getBehaviorParams();
		if (behaviorParams.behavior === 'harvesting'){
			var resource = behaviorParams.resourceHarvested;
			//If the worker isn't holding anything, find the nearest tile that has 'resource'
			var target = this.findClosestExploredTileConditional(t => {
				return t.canHarvestResourceFrom(resource);
			});
			if (target) this.moveTowards(target);
			else return;
		}
		else{
			this.moveRandomly();
		}
	}
}

module.exports = Worker;