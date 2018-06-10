var config = require('../../../config');
var Unit = require('./Unit.abstract');
var rand = require('random-seed').create();

class Worker extends Unit{
	constructor(args){
		args.character = 'w';
		args.type = 'worker';
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