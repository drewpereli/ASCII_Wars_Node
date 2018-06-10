
var Building = require('./building.abstract')
var unitClasses = require('require-dir-all')(
	'../units', {recursive: true}
	);
var shuffle  shuf = require('shuffle-array');


class Producer extends Building{

	constructor(args){
		super(args);
		this.producedUnitName = args.producedUnitName;
		this.producedUnitClass = unitClasses[args.producedUnitName];
		this.productionTime = args.productionTime;
	}

	act(){
		//Find an open tile adjacent to this tile
		var randomTiles = this.tile.siblings;
		shuffle(randomTiles);
		var openTile = randomTiles.find(t => {
			return t.isOpen();
		});
		if (openTile){
			var actor = new this.producedUnitClass({tile: tile, player: this.player});
			this.timeUntilNextAction = this.productionTime;
		}
		else{
			return;
		}
	}

}

module.exports = Producer;