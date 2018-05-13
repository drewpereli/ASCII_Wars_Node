

var config = require('../../../config')
var Model = require('../Model.abstract');
var Squad = require('./Squad');
var actorClasses = require('require-dir-all')(
	'../actors', {recursive: true}
	);


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
		if (config.debug.debugMode && config.debug.allTilesVisible){
			return this.game.map.tiles.reduce((a, current) => {return a.concat(current)}, []);
		}
		var visibleTiles = [];
		this.getActors().forEach(a => {
			a.getVisibleTiles().forEach(t => {
				if (!visibleTiles.includes(t)) visibleTiles.push(t);
			})
		});
		return visibleTiles;
	}


	attemptBuildingConstruction(tile, buildingName){
		if (!(buildingName in actorClasses.buildings)){
			console.log('No class for building name : ' + buildingName);
			return false;
		}
		if (!tile.isOpen()) return false;
		//Construct building!
		console.log('Constructing new ' + buildingName);
		var building = new actorClasses.buildings[buildingName]({player: this, tile: tile});
		return true;
	}

}

module.exports = Player;



