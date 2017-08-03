var Model = require('../Model.abstract');


class Actor extends Model{

	constructor(){
		super(arguments);

		var args = {
			name: null,
			readableName: null,
			character: null,
			tile: null,
			player: null,
			maxHealth: null,
			moveTime: 0,
			clientFacingFields: ['player', 'maxHealth', 'health', 'character']
		};
		Object.assign(args, arguments[0]);

		Object.assign(this, args);
		this.tile.setActor(this);
		this.health = this.maxHealth; //max health must be set in child class
		this.dead = false;
		this.timeUntilNextAction = 0;
	}


	tick(){
		console.log(this.readableName, this.player.team);
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