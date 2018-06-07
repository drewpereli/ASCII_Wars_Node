var config = require('../../../config');
var Unit = require('./Unit');
var rand = require('random-seed').create();

class Soldier extends Unit{
	constructor(args){
		args.character = 's';
		args.type = 'soldier';
		super(args);
	}


	act(){
		var randomNum = rand.random();
		if (randomNum < .00){
			return;
		}
		var behaviorParams = this.getBehaviorParams();
		var behaviorChoice;
		var enemy;
		if (enemy = this.canSeeEnemy()) behaviorChoice = 'ATTACKING';
		else if (behaviorParams.digging) behaviorChoice = Math.random() < .5 ? 'DIGGING' : 'MOVING'; 
		else if (behaviorParams.movingTo) behaviorChoice = 'MOVING';
		if (behaviorChoice === 'DIGGING'){
			this.dig(behaviorParams.diggingDirection);
		}
		else if (behaviorChoice === 'ATTACKING')
			this.attack(enemy);
		else if (behaviorChoice === 'MOVING'){
			if (randomNum < .2)
				this.moveRandomly();
			else
				this.moveTowardsSquadMovePoint();
		}
	}
}

module.exports = Soldier;