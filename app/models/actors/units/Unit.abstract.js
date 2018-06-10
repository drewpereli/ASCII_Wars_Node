var config = require('../../../../config');
var Actor = require('../Actor.abstract');
var rand = require('random-seed').create();

class Unit extends Actor{

	constructor(specifiedArgs){
		var defaultArgs = {	
			maxHealth: 100,
			moveTime: 1,
			defense: 0,
			damage: false,
			attackTime: false
		}
		var args = defaultArgs;
		Object.assign(args, specifiedArgs);
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

	move(tile){
		this.tile.setActor(false);
		this.tile = tile;
		tile.setActor(this);
		this.timeUntilNextAction = Math.ceil(this.moveTime * this.getMoveWeight(this.tile, tile));
		this.setVisibleTiles();
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
		var behaviorParams = this.getBehaviorParams();
		if (!behaviorParams.movingTo) return;
		var target = this.tile.map.getTile(behaviorParams.movingTo.x, behaviorParams.movingTo.y);
		if (this.tile.siblings.includes(target) && this.canOccupy(target))
			return this.move(target);
		var scores = [0,0,0,0,0,0,0,0];
		//Get which sib is closest to tile
		var tileInfos = [];
		var uniqueDistances = [];
		var uniqueSurroundingSquadMates = [];
		var uniqueAlignmentScores = [];
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
			var alignmentScore = 0;
			if (behaviorParams.alignment) {
				if (behaviorParams.alignment === 'E-W'){
					var distanceFromLine = Math.abs(target.getYDiff(t)); //0 is best, infinity is worst
					//The score is a lot better if the tile is within the rectangle of the wall
					var distanceFromLineScore = distanceFromLine > 1 ? Math.pow(2, -.1 * distanceFromLine) / 2 : 2;
					alignmentScore = distanceFromLineScore;
				}
				else if (behaviorParams.alignment === 'N-S'){
					var distanceFromLine = Math.abs(target.getXDiff(t)); //0 is best, infinity is worst
					//The score is a lot better if the tile is within the rectangle of the wall
					var distanceFromLineScore = distanceFromLine > 1 ? Math.pow(2, -.1 * distanceFromLine) / 2 : 2;
					alignmentScore = distanceFromLineScore;
				}
				if (!uniqueAlignmentScores.includes(alignmentScore)) uniqueAlignmentScores.push(alignmentScore);

			}
			tileInfos.push({
				tile: t,
				distance: dist,
				surroundingSquadMates: surroundingSquadMates,
				alignmentScore: alignmentScore,
				score: null
			});
			if (!uniqueDistances.includes(dist)) uniqueDistances.push(dist);
			if (!uniqueSurroundingSquadMates.includes(surroundingSquadMates)) uniqueSurroundingSquadMates.push(surroundingSquadMates);
		});
		//Sort unique distances and surroudnign squad mates arrays
		//Surrounding squad mates lowest to highest, and distance highest to lowest, so that the best ones are at the highest indeces
		uniqueDistances.sort((a, b) => b - a);
		uniqueSurroundingSquadMates.sort((a, b) => a - b);
		if (behaviorParams.alignment)
			uniqueAlignmentScores.sort((a, b) => a - b);
		//Set the scores
		//This part is a bit tricky
		//For distance and num surrounding mates
		//	Get the index of this value in the corresponding array, and divide it by the length of the array
		// Multiply this value by the corresponding weight
		// Add result to the score
		tileInfos.forEach(tInfo => {
			//The further in the array each score is, the better
			var distIndex = uniqueDistances.indexOf(tInfo.distance); //The rank in the sorted array
			var distanceScoreContribution = distIndex / uniqueDistances.length * behaviorParams.moveTowardsPointWeight;
			//If we're trying to align, there's a certain chance that the distance doesn't matter at all
			if (behaviorParams.alignment && Math.random() < .9) distanceScoreContribution = 0;
			var matesIndex = uniqueSurroundingSquadMates.indexOf(tInfo.surroundingSquadMates);
			var matesScoreContribution = matesIndex / uniqueSurroundingSquadMates.length * behaviorParams.moveTowardsSquadMatesWeight;
			tInfo.score = distanceScoreContribution + matesScoreContribution;
			if (behaviorParams.alignment) {
				var alignmentIndex = uniqueAlignmentScores.indexOf(tInfo.alignmentScore);
				var alignmentContribution = alignmentIndex / uniqueAlignmentScores.length * behaviorParams.alignmentWeight;
				tInfo.score += alignmentContribution;
			}
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
		if (candidates.length === 0) {
			this.moveRandomly();
			return;
		}
		//Don't work harder than you have to
		if (candidates.includes(this.tile)) return;
		this.move(candidates[rand(candidates.length)]);
	}

	attack(enemy){
		enemy.takeDamage(this.damage);
	}


	dig(dir){
		//Make sure the current tile is above the lowest elevation, and the tile in the direction of dir is below the highest elevation
		if (this.tile.elevation <= config.model.map.minElevation)
			return;
		if (this.tile.siblings[dir].elevation >= config.model.map.maxElevation)
			return;
		var elDiff = this.tile.siblings[dir].elevation - this.tile.elevation;
		this.timeUntilNextAction = elDiff <= 1 ? 1 : Math.round(elDiff);
		this.tile.decrementElevation();
		this.tile.siblings[dir].incrementElevation();
	}

	getBehaviorParams(){
		return this.player.getSquad(this.squad).getBehaviorParams();
	}


	//Weight of moving from tile1 to tile2
	getMoveWeight(tile1, tile2){
		return 1;
	}
}

module.exports = Unit;