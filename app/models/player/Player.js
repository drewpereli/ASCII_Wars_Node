var  arrayDiff = require('simple-array-diff');

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
		this.visibleTilesLastEmit = [];
		//this.visibleTilesThisEmit = [];
	}

	getActors(){
		return this.game.actors.filter(a => a.player === this);
	}

	getSquad(num){
		return this.squads[num];
	}

	getVisibleTiles(){
		var visibleTiles = [];
		this.getActors().forEach(a => {
			a.getVisibleTiles().forEach(t => {
				if (!visibleTiles.includes(t)) visibleTiles.push(t);
			})
		});
		return visibleTiles;
	}

	getNewlyVisibleAndInvisibleTiles(){
		//Tiles in "visibleLastEmit" but not visible now are newly invisible
		//Tiles visible not in "visibleLastEmit" are newly visible
		var result = arrayDiff(this.visibleTilesLastEmit, this.getVisibleTiles());
		return {
			newlyVisible: result.added,
			newlyInvisible = result.removed
		}
	}

}

module.exports = Player;



