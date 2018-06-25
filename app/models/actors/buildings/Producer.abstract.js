var config = require('../../../../config');
var Building = require('./Building.abstract')
var unitClasses = require('require-dir-all')(
	'../units', {recursive: true}
	);
var shuffle = require('shuffle-array');


class Producer extends Building{

	constructor(args){
		super(args);
		this.producedUnitName = args.producedUnitName;
		this.producedUnitClass = unitClasses[args.producedUnitName];
		this.productionTime = args.productionTime;
		this.producedUnitSquadRange = [0, 0];
		this.lastUnitSquad = 0;
		this.unitsProduced = 0;
		this.producer = true;
		this.clientFacingFields = this.clientFacingFields.concat(['productionTime', 'producing', 'producer']);
	}

	act(){
		if (config.debug.debugMode && config.debug.producerLimit && this.unitsProduced >= config.debug.producerLimit) return;
		if (!this.acting) return;
		//Find an open tile adjacent to this tile
		var randomTiles = this.tile.siblings;
		shuffle(randomTiles);
		var openTile = randomTiles.find(t => {
			return t.isOpen();
		});
		//If there is an open tile, produce the unit;
		if (openTile){
			var squad = this.lastUnitSquad + 1;
			if (squad > this.producedUnitSquadRange[1]) squad = this.producedUnitSquadRange[0];
			var actor = new this.producedUnitClass({tile: openTile, player: this.player, squad: squad});
			this.lastUnitSquad = squad;
			this.game.addActor(actor);
			this.timeUntilNextAction = this.productionTime;
			this.unitsProduced++;
		}
		else{
			return;
		}
	}

	setProducedSquad(n1, n2){
		this.producedUnitSquadRange = [Math.min(n1, n2), Math.max(n1, n2)];
	}

}

module.exports = Producer;