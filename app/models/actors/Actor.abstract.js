var Model = require('../Model.abstract');
var rand = require('random-seed').create();
var config = require('../../../config');
var shortId = require('shortid');
shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_=');
var shuffle = require('shuffle-array');


class Actor extends Model{

	constructor(args){

		var defaultArgs = {
			name: null,
			readableName: null,
			playerGivenName: args.readableName + ' at (' + args.tile.x + ', ' + args.tile.y + ')',
			character: null,
			tile: null,
			player: null,
			maxHealth: null,
			moveTime: null,
			sightRange: 3,
			holding: false,
			clientFacingFields: ['player', 'maxHealth', 'health', 'character', 'type', 'name', 'playerGivenName', 'id']
		};
		Object.assign(defaultArgs, args);

		super(defaultArgs);

		Object.assign(this, args);
		this.id = shortId.generate();
		this.game = this.tile.map.game;
		this.map = this.game.map;
		this.tile.setActor(this);
		this.team = this.player ? this.player.team : null;
		this.health = this.maxHealth; //max health must be set in child class
		this.dead = false;
		this.timeUntilNextAction = Math.floor(Math.random() * this.moveTime);//rand.range(this.moveTime);
		this.visibleTiles = [];
		this.setVisibleTiles();
	}

	takeDamage(damage){
		this.health -= damage;
		this.tile.changed.actor = true;
		if (this.health <= 0) this.die();
	}

	tick(){
		this.timeUntilNextAction--;
		if (this.timeUntilNextAction <= 0)
			this.act();
	}


	die(){
		this.tile.unsetActor();
		this.tile = false;
		this.dead = true;
	}

	setVisibleTiles(){
		this.visibleTiles = [];
		var mapHeight = config.model.map.height;
		var mapWidth = config.model.map.width;
		for (var x = this.tile.x - this.sightRange ; x <= this.tile.x + this.sightRange ; x++){
			for (var y = this.tile.y - this.sightRange ; y <= this.tile.y + this.sightRange ; y++){
				var realX = (x + mapWidth) % mapWidth;
				var realY = (y + mapHeight) % mapHeight;
				var t = this.tile.map.getTile(realX, realY)
				this.visibleTiles.push(t);
				/*
				if (!this.player.visibleTilesThisTurn.includes(t)){
					this.player.visibleTilesThisTurn.push(t);
				}
				*/
			}
		}
	}

	getVisibleTiles(){ return this.visibleTiles; }

	static canOccupy(tile){
		return tile.isOpen();
	}

	canOccupy(tile){
		return this.constructor.canOccupy(tile);
	}

	canSeeEnemy(){
		var enemyTile = this.getVisibleTiles().find(t => {
			return t.actor && t.actor.team !== this.team;
		});
		if (enemyTile) return enemyTile.actor;
		else return false;
	}

	findClosestExploredTileConditional(conditionFunction, searchStart=false, limit=10000){
		if (!searchStart) searchStart = this.tile;
		//If the search start isn't a pointer to an object in the map, make it one if we can
		if (!('siblings' in searchStart)) searchStart = this.game.map.getTile(searchStart.x, searchStart.y);
		if (conditionFunction(searchStart)) return searchStart;
		var tilesSearched = [searchStart];
		//Depth first search
		var queue = [searchStart];
		while (queue.length > 0 && (limit === false || tilesSearched.length < limit)){
			var currentTile = queue.shift(); //Take out first element
			var shuffledUncheckedSibs = currentTile.siblings.filter(t => t.seenBy.includes(this.player) && !tilesSearched.includes(t));
			shuffle(shuffledUncheckedSibs);
			for (let sib of shuffledUncheckedSibs){
				if (conditionFunction(sib)) return sib;
				queue.push(sib);
				tilesSearched.push(sib);
			}
		}
		return false;
	}

	findClosestUnexploredTile(searchStart=false, limit=10000){
		if (!searchStart) searchStart = this.tile;
		//If the search start isn't a pointer to an object in the map, make it one if we can
		if (!('siblings' in searchStart)) searchStart = this.game.map.getTile(searchStart.x, searchStart.y);
		var tilesSearched = [];
		//Depth first search
		var queue = [searchStart];
		while (queue.length > 0 && (limit === false || tilesSearched.length < limit)){
			//console.log(queue.length);
			var currentTile = queue.shift(); //Take out first element
			if (!currentTile.seenBy.includes(this.player)) return currentTile;
			tilesSearched.push(currentTile);
			var shuffledUncheckedSibs = currentTile.siblings.filter(t => !tilesSearched.includes(t));
			shuffle(shuffledUncheckedSibs);
			queue = queue.concat(shuffledUncheckedSibs);
		}
		return false;
	}


	isNextToOrOn(tile){
		if (this.tile === tile) return true;
		if (this.tile.siblings.includes(tile)) return true;
		return false;
	}
}


module.exports = Actor;