var config = require('../../../config')
var Model = require('../Model.abstract');
var Squad = require('./Squad');

class Player extends Model{
	constructor(args){
		super();
		this.socket = args.socket;
		this.team = args.team;
		this.readyForNextTurn = false;
		this.clientFacingFields = ['team'];
		this.game = args.game;
		this.squads = [];
		for (var i = 0 ; i < config.maxSquads ; i++){
			this.squads.push(new Squad({squadNum: i}));
		}
	}

	getActors(){
		return this.game.actors.filter(a => a.player === this);
	}

	getSquad(num){
		return this.squads[num];
	}

}

module.exports = Player;