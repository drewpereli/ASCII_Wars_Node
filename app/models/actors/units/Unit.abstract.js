var config = require('../../../../config');
var Actor = require('../Actor.abstract');
var rand = require('random-seed').create();

class Unit extends Actor{

	constructor(specifiedArgs){
		var defaultArgs = {	
			maxHealth: 100,
			moveTime: 1,
			defense: 0,
			damage: 1,
			attackTime: 10,
			constructionTime: 10
		}
		var args = defaultArgs;
		Object.assign(args, specifiedArgs);
		super(args);
		this.clientFacingFields.push('squad');
		this.squad = args.squad;
		this.holding = false;
	}

	act(){
		var behaviorParams = this.getBehaviorParams();
		var behavior = behaviorParams.behavior;
		if (behavior === 'attacking'){
			var enemy;
			if (enemy = this.canSeeEnemy()) this.attack(enemy);
			if (Math.random() < .2)
				this.moveRandomly();
			else
				this.moveTowardsSquadMovePoint();
		}
		else if (behavior === 'digging') {
			if (Math.random() < .5) this.moveRandomly();
			else this.dig(behaviorParams.diggingDirection);
		}
		else if (behavior === 'moving'){
			if (Math.random() < .2)
				this.moveRandomly();
			else
				this.moveTowardsSquadMovePoint();
		}
		else if (behavior === 'harvesting'){
			var resource = behaviorParams.resourceHarvested;
			//If the worker isn't holding anything, find tile that has 'resource'
			if (!this.holding) {
				//If there is a pickup location, find closest tile with 'resource' that location
				//Else, find the tile closest to this.tile with 'resource'
				var pickupTarget = behaviorParams.resourcePickup ? behaviorParams.resourcePickup : this.tile;
				var pickupActual = this.findClosestExploredTileConditional(t => {
					if (!t.canProduce(resource)) return false;
					//We don't want to pick up from our drop off point
					if (t.x === behaviorParams.resourceDropoff.x && t.y === behaviorParams.resourceDropoff.y) return false;
					return true;
				}, pickupTarget);
				if (pickupActual){
					console.log('Found tile to pick up at');
					if (this.isNextToOrOn(pickupActual)) this.harvest(resource, pickupActual);
					else this.moveTowards(pickupActual);
				}
				else{
					console.log('Could not find tile to pick up resource at');
					//Auto explore
					var unexplored = this.findClosestUnexploredTile();
					if (unexplored){
						this.moveTowards(unexplored);
					} 
					else{
						this.moveRandomly();
					} 
				}
			}
			//Else if we are holding a resource
			else{
				var dropoffActual = this.game.map.getTile(behaviorParams.resourceDropoff.x, behaviorParams.resourceDropoff.y);
				if (dropoffActual) {
					//If the dropoff target is a sibling, drop it off!
					if (this.isNextToOrOn(dropoffActual)) {
						var dropoffBuilding = dropoffActual.actor;
						if (dropoffBuilding.getRemainingStorage() <= 0){
							console.log('Dropoff building has no remaining storage');
							return;
						}
						else {
							console.log('Dropping off resource');
							this.dropOff(dropoffActual.actor);
						}
					}
					else {
						console.log('Moving towards drop point');
						this.moveTowards(dropoffActual);
					} 
				}
				else console.log('Could not find tile to drop off resource at');
			}
		}
		else if (behavior  === 'building'){
			//Find nearest incomplete building
			var buildingTile = this.findClosestExploredTileConditional(t => {
				return t.actor && t.actor.type === 'building' && t.actor.isIncomplete() && t.actor.player === this.player;
			});
			if (!buildingTile) return this.moveRandomly();
			if (this.isNextToOrOn(buildingTile)) return this.construct(buildingTile.actor);
			else this.moveTowards(buildingTile);
		}
		else{
			this.moveRandomly();
		}
	}

	attack(enemy){
		enemy.takeDamage(this.damage);
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
		this.moveTowards(target);
	}


	moveTowards(target){
		if (this.tile.siblings.includes(target) && this.canOccupy(target))
			return this.move(target);
		var behaviorParams = this.getBehaviorParams();
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


	harvest(resource, tile){
		if (tile.produceResource(resource)){
			this.holding = resource;
			//console.log('Harvested ' + resource + ' from ', tile.x, tile.y);
		}
		else{
			console.log('Tile did not produce resource ' + resource + '. Tile: ' + tile);
			return;
		}
	}


	dropOff(building){
		if (building.addStorage(this.holding)){
			//console.log('Dropped off ' + this.holding + ' at ', building.tile.x, building.tile.y);
			this.holding = false;
		}
		else{
			console.log('Building would not accept resource ' + this.holding + '. Building: ' + building);
		}
	}


	construct(building){
		building.increaseCompleteness();
		this.timeUntilNextAction = this.constructionTime;
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