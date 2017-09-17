var config = require('../../../config');
var Actor = require('./Actor.abstract');
var rand = require('random-seed').create();

class Unit extends Actor{

	constructor(args){
		args.maxHealth = 100;
		args.moveTime = 1;
		args.defense = 4;
		args.character = '\u2022';
		super(args);
		this.clientFacingFields.push('squad');
		this.squad = args.squad;
	}

	act(){
		var randomNum = rand.random();
		if (randomNum < .01){
			return;
		}
		var behaviorParams = this.getBehaviorParams();
		if (behaviorParams.digging){
			this.dig(behaviorParams.diggingDirection);
		}
		else if (behaviorParams.movingTo){
			if (randomNum > .1)
				this.moveTowardsSquadMovePoint();
			else
				this.moveRandomly();
		}
	}

	move(tile){
		this.tile.setActor(false);
		this.tile = tile;
		tile.setActor(this);
		this.timeUntilNextAction = Math.ceil(this.moveTime * this.getMoveWeight(this.tile, tile));
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

	moveTowardsSquadMovePoint(){
		var target = this.getBehaviorParams().movingTo;
		if (!target) return;
		//Get which sib is closest to tile
		var shortestDistance = Infinity;
		var candidates = [];
		for (var i = 0 ; i < this.tile.siblings.length ; i++){
			var t = this.tile.siblings[i];
			//if (!this.canOccupy(t))	break;
			if (t === target){
				candidates = [target];
				break;
			}
			var dist = t.getDistance(target);
			if (dist < shortestDistance){
				shortestDistance = dist;
				candidates = [t];
			}
			else if (dist === shortestDistance){
				candidates.push(t);
			}
		}
		//Filter out the candidates that can't be moved to
		candidates = candidates.filter(t => this.canOccupy(t));
		//If there are no candidates left, move to the sib that has the most friendly units surrounding it
		if (candidates.length === 0) {
			//Check number of friendlies currently around self
			var maxFriendlies = 0;
			this.tile.siblings.forEach(sib => {
				if (sib.actor && sib.actor.squad === this.squad)
					maxFriendlies++;
			});
			candidates = [this.tile];
			for (var i = 0 ; i < this.tile.siblings.length ; i++){
				//Get number of surrounding friendlies for this tile
				var t = this.tile.siblings[i];
				if (!this.canOccupy(t)) continue;
				var friendlyCount = 0;
				t.siblings.forEach(sib => {
					//Don't count this tile
					if (sib === this.tile) return;
					if (sib.actor && sib.actor.squad === this.squad)
						friendlyCount++;
				});
				if (friendlyCount > maxFriendlies){
					maxFriendlies = friendlyCount;
					candidates = [t];
				}
				else if (friendlyCount === maxFriendlies)
					candidates.push(t)
			}
		}
		if (candidates.length === 1){
			if (candidates[0] === this.tile)
				return;
			return this.move(candidates[0]);
		}
		//Get random candidate
		this.move(candidates[rand(candidates.length)]);
	}

	dig(dir){
		//Make sure the current tile is above the lowest elevation, and the tile in the direction of dir is below the highest elevation
		if (this.tile.elevation <= config.model.map.minElevation)
			return;
		if (this.tile.siblings[dir].elevation >= config.model.map.maxElevation)
			return;
		this.tile.decrementElevation();
		this.tile.siblings[dir].incrementElevation();
	}

	getBehaviorParams(){
		return this.player.getSquad(this.squad).getBehaviorParams();
	}

	canOccupy(tile){
		return tile.isOpen();
	}

	//Weight of moving from tile1 to tile2
	getMoveWeight(tile1, tile2){
		return 1;
	}
}

module.exports = Unit;