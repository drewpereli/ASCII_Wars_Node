var Model = require('../Model.abstract');
var rand = require('random-seed').create();

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
			clientFacingFields: ['player', 'maxHealth', 'health', 'character', 'type']
		};
		Object.assign(defaultArgs, args);

		super(defaultArgs);

		Object.assign(this, args);
		this.tile.setActor(this);
		this.health = this.maxHealth; //max health must be set in child class
		this.dead = false;
		this.timeUntilNextAction = Math.floor(Math.random() * this.moveTime);//rand.range(this.moveTime);
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

}


module.exports = Actor;