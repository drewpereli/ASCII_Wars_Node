var Model = require('../Model.abstract');
var rand = require('random-seed').create();
var config = require('../../../config');

class Actor extends Model{

	constructor(args){

		var defaultArgs = {
			name: null,
			readableName: null,
			character: null,
			tile: null,
			player: null,
			maxHealth: null,
			moveTime: null,
			sightRange: 3,
			clientFacingFields: ['player', 'maxHealth', 'health', 'character', 'type']
		};
		Object.assign(defaultArgs, args);

		super(defaultArgs);

		Object.assign(this, args);
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
		console.log(this.health);
		if (this.health <= 0) this.die();
	}


	tick(){
		this.timeUntilNextAction--;
		if (this.timeUntilNextAction <= 0)
			this.act();
	}


	act(){}


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

}


module.exports = Actor;