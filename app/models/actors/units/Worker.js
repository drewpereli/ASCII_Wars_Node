
var Unit = require('./Unit.abstract');

class Worker extends Unit{
	constructor(args){
		args.character = 'w';
		args.name = 'worker';
		super(args);
	}


	act(){
		var behaviorParams = this.getBehaviorParams();
		if (behaviorParams.harvesting){
			//Harvest
		}
		else{
			this.moveRandomly();
		}
	}
}

module.exports = Worker;