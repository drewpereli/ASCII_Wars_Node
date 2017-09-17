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
		if (randomNum < .00){
			return;
		}
		var behaviorParams = this.getBehaviorParams();
		if (behaviorParams.digging){
			this.dig(behaviorParams.diggingDirection);
		}
		else if (behaviorParams.movingTo){
			if (randomNum >= .0)
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

	/*
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
	*/

	moveTowardsSquadMovePoint(){
		var behaviorParams = this.getBehaviorParams();
		var target = behaviorParams.movingTo;
		if (!target) return;
		if (this.tile.siblings.includes(target) && this.canOccupy(target))
			return this.move(target);
		var scores = [0,0,0,0,0,0,0,0];
		//Get which sib is closest to tile
		var tileInfos = [];
		var uniqueDistances = [];
		var uniqueSurroundingSquadMates = [];
		//Get tile info
		this.tile.siblings.concat(this.tile).forEach(t =>{
			//If the tile can't be occupied and it's not the current tile we're on, reject it
			if (!this.canOccupy(t) && t !== this.tile){
				return;
			}
			var dist = t.getDistance(target);
			var surroundingSquadMates = t.siblings.reduce((a, sib) => {
				if (sib === t) return a; //Don't count the currently inspected tile
				if (sib.actor && sib.actor.squad && sib.actor.squad === this.squad && sib.actor !== this)
					return a + 1;
				else
					return a;
			}, 0);
			tileInfos.push({
				tile: t,
				distance: dist,
				surroundingSquadMates: surroundingSquadMates,
				score: null
			});
			if (!uniqueDistances.includes(dist)) uniqueDistances.push(dist);
			if (!uniqueSurroundingSquadMates.includes(surroundingSquadMates)) uniqueSurroundingSquadMates.push(surroundingSquadMates);
		});
		//Sort unique distances and surroudnign squad mates arrays
		//Surrounding squad mates lowest to highest, and distance highest to lowest, so that the best ones are at the highest indeces
		uniqueDistances.sort((a, b) => b - a);
		uniqueSurroundingSquadMates.sort((a, b) => a - b);
		//console.log(uniqueDistances);
		//Set the scores
		//This part is a bit tricky
		//For distance and num surrounding mates
		//	Get the index of this value in the corresponding array, and divide it by the length of the array
		// Multiply this value by the corresponding weight
		// Add result to the score
		tileInfos.forEach(tInfo => {
			var distIndex = uniqueDistances.indexOf(tInfo.distance);
			var distanceScoreContribution = distIndex / uniqueDistances.length * behaviorParams.moveTowardsPointWeight;
			var matesIndex = uniqueSurroundingSquadMates.indexOf(tInfo.surroundingSquadMates);
			var matesScoreContribution = matesIndex / uniqueSurroundingSquadMates.length * behaviorParams.moveTowardsSquadMatesWeight;
			tInfo.score = distanceScoreContribution + matesScoreContribution;
		});
		//Get highest score
		var maxScore = -1;
		var candidates = [];
		tileInfos.forEach(tInfo => {
			if (tInfo.score > maxScore){
				maxScore = tInfo.score;
				candidates = [tInfo.tile];
			}
			else if (tInfo.score === maxScore){
				candidates.push(tInfo.tile);
			}
		});
		//console.log('Candidates: ' + candidates.length);
		if (candidates.length === 1){
			if (candidates[0] === this.tile) return;
			//console.log('y');
			this.move(candidates[0]);
		}
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