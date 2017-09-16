
var Actor = require('../Actor.abstract');
var rand = require('random-seed').create();

class Unit extends Actor{

	constructor(args){
		super(args);
		this.clientFacingFields.push('squad');
		this.squad = args.squad;
	}

	move(tile){
		this.tile.setActor(false);
		this.tile = tile;
		tile.setActor(this);
		this.timeUntilNextAction = this.moveTime;
	}

	moveRandomly(){
		for (var i = 0 ; i < 4 ; i++){
			var t = this.tile.siblings[rand.range(this.tile.siblings.length)];
			if (t.isOpen()){
				this.move(t);
				return;
			}
		}
	}

	//Moves towards the tile in this.squad.behaviorParams.moveTo
	moveTowardsSquadMovePoint(){
		var tile = this.getBehaviorParams().movingTo;
		if (!tile) return;
		//Get general direction
		var dir;
		if (tile.x > this.tile.x){
			if (tile.y > this.tile.y)
				dir = 3;
			else
				dir = 1;
		}
		else{
			if (tile.y > this.tile.y)
				dir = 5;
			else
				dir = 7;
		}
		var t = this.tile.getTileInDirAwayFrom(dir, 1);
		if (t.isOpen())
			this.move(t);
		else
			this.moveRandomly();
	}

	getBehaviorParams(){
		return this.player.getSquad(this.squad).getBehaviorParams();
	}
}

module.exports = Unit;