
const config = require('../../../config');
const rand = require('random-seed').create();
const Tile = require(__dirname + '/Tile');
var Model = require('../Model.abstract');
var actorClasses = require('require-dir-all')(
	'../actors', {recursive: true}
);



class Map extends Model{
	constructor(game) {
		super();
		this.game = game;
		this.width = config.model.map.width;
		this.height = config.model.map.height;
		this.tiles = [];
		for (var y = 0 ; y < this.height ; y++){
			this.tiles.push([]);
			for (var x = 0 ; x < this.width ; x++){
				this.tiles[y].push(new Tile(this, x, y));
			}
		}
		this.setTileSiblings();
	}



	//Gets an object containing the map data to send to the client
	getClientDataFor(player){
		return this.tiles.map(tArray => tArray.map(t => t.getClientDataFor(player)));
	}


	setTileSiblings() {
		for (var y = 0 ; y < this.height ; y++){
			for (var x = 0 ; x < this.width ; x++){
				var t = this.getTile(x, y);
				t.setSiblings();
			}
		}
	}


	getTile(x, y){
		return this.tiles[y][x];
	}


	//Create the terrain
	generate() {
		//Helper functions
		/*
		var setElevations = () => {
			return new Promise((resolve, reject) => {
				var iterate = (iteration) => {
					if (iteration >= config.model.map.generation.iterations){
						resolve();
						return;
					}
					//Set a random tile to elevation 50
					var t = this.tiles[rand.range(this.height)][rand.range(this.width)];
					t.elevation = rand(100);
					setTimeout(() => {iterate(iteration + 1);}, 100);
				}
				iterate(0);
			})
		}
		*/
		var setElevations = () => {
			return new Promise((resolve, reject) => {
				//Set x random points to random elevations
				//Iterate through each cell. Set it to the average of the elevations of the surrounding cells
				//Do this a few times

				var anchorTiles = [];
				this.forEachTile(t => {
					if (rand(100) < 5){
						t.setElevation(rand(101));
						anchorTiles.push(t);
					}
				});
				this.forEachTile(t => {
					if (anchorTiles.includes(t)){
						return;
					}
					//Get weighted average of elevations of anchor tiles weighted by 1 / distance to t
					var total = 0;
					var totalElevation = 0;
					anchorTiles.forEach(anchorTile => {
						var d = anchorTile.getDistance(t);
						var weight = Math.pow(.5, d); //As d increases, weight decreases. 
						total += weight;
						totalElevation += weight * anchorTile.elevation;
					});
					t.elevation = Math.round(totalElevation / total);
				});
				resolve();
				/*
				var iterate = (iteration) => {
					if (iteration >= config.model.map.generation.iterations){
						resolve();
						return;
					}
					setTimeout(() => {iterate(iteration + 1);}, 0);
				}
				iterate(0);
				*/
			})
		}
		var placeCommandCenters = () => {
			return new Promise((resolve, reject) => {
				//For each player
				for (var i in this.game.players){
					var p = this.game.players[i];
					var t = this.getRandomOpenTile();
					var commandCenter = new actorClasses.buildings.CommandCenter({tile: t, player: p});
					this.game.addActor(commandCenter);
				}
				resolve();
			});
		}
		var addWater = () => {
			for (var i = 0 ; i < 10 ; i++){
				this.getRandomTile().setWaterDepth(1);
			}
		}

		return new Promise((resolve, reject) => {
			//For now just set random elevations
			setElevations()
			.then(() => {
				return addWater();
			})
			//Generate the command centers
			.then(() => {
				//return placeCommandCenters();
				return Promise.resolve();
			})
			//Done
			.then(() => {
				//Place a random worker
				//this.game.addActor(new actorClasses.units.Worker({tile: this.getRandomOpenTile(), player: this.game.players[0]}));
				resolve();
			})
			//Error
			.catch(err => {
				reject(err);
			});
		});


	}



	getRandomTile() {
		return this.getTile(rand(this.width), rand(this.height));
	}


	getRandomOpenTile(){
		var currentTile;
		do{
			currentTile = this.getRandomTile();
		}
		while (!currentTile.isOpen())
		return currentTile;
	}



	forEachTile(func){
		for (var i in this.tiles){
			var row = this.tiles[i];
			for (var j in row){
				var tile = row[j];
				func(tile);
			}
		}
	}




}


module.exports = Map;











