
var Model = require('../Model.abstract');

class Player extends Model{
	constructor(args){
		super();
		this.socket = args.socket;
		this.team = args.team;
		this.readyForNextTurn = false;
		this.timeState = 'paused'; //Paused or playing
		this.clientFacingFields = ['team'];
		this.game = args.game;
	}

	getActors(){
		return this.game.actors.filter(a => a.player === this);
	}

	changeTimeState(timeState){
		if (!['playing', 'paused'].includes(timeState))
			throw new Error("Time state must be 'playing' or 'paused'. '" + timeState + "' given");
		this.timeState = timeState;
	}
}

module.exports = Player;