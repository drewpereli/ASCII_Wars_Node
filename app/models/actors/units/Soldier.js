
var Unit = require('./Unit.abstract');
var rand = require('random-seed').create();


class Soldier extends Unit{
	constructor(args){
		args.character = 's';
		args.name = 'soldier';
		args.defense = 10;
		args.damage = false;
		args.attackTime = false;
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
		if (behaviorParams.behavior === 'attacking')
			if (enemy = this.canSeeEnemy()) behaviorChoice = 'ATTACKING';
			else behaviorChoice = 'MOVING';
		else if (behaviorParams.behavior === 'digging') behaviorChoice = Math.random() < .5 ? 'DIGGING' : 'MOVING'; 
		else if (behaviorParams.behavior === 'harvesting') behaviorChoice = 'HARVESTING';
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
		else if (behaviorChoice === 'HARVESTING'){
			//If a supply depot hasn't been selected, select the closest one
			//But for now, do nothing
			if (!behaviorParams.dropOff) return;
			
		}
	}

	attack(enemy){
		enemy.takeDamage(this.damage);
	}
}

module.exports = Soldier;