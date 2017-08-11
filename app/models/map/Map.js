
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
		var setElevations = () => {
			var getRandomElevationGenerationParams = () => {
				return {
					numAnchorTiles: rand(8) + 1,
					minElevation: rand(80) + 0,
					elevationRange: rand(35) + 5,
					moisture: rand(60) + 20
				};
			}
			var setRegionTiles = regions => {
				//For each tile, see what region tile it's closest to, and add it to that region
				this.forEachTile(t => {
					var minDistance = false;
					var regionCandidates = [];
					regions.forEach(r => {
						var d = r.mainTile.getDistance(t);
						if (minDistance === false || d < minDistance){
							minDistance = d;
							regionCandidates = [r];
						}
						else if (d === minDistance){
							regionCandidates.push(r);
						}
					});
					//Pick a random region candidate
					var region = regions[rand(regions.length)];
					//Add this tile to the regions tiles
					region.tiles.push(t);
				});
			}
			var setRegionAnchorTiles = region => {
				for (var i = 0 ; i < region.params.numAnchorTiles ; i++){
					var candidate;
					do{
						candidate = region.tiles[rand(region.tiles.length)];
					}
					while (region.anchorTiles.includes(candidate));
					region.anchorTiles.push(candidate);
					//Set candidate elevation
					candidate.elevation = rand(region.params.elevationRange) + region.params.minElevation;
				}
			}
			var setElevations = regions => {
			}
			

			return new Promise((resolve, reject) => {
				//Break up map into regions
				//Each region will have different genereation paramaters
				var numRegions = 5;
				var regions = []; 
				for (var i = 0 ; i < numRegions ; i++){
					do{
						var candidate = this.getRandomTile();
						//If candidate is 
						if (typeof regions.find(r => r.mainTile === candidate) !== 'undefined'){
							continue;
						}
						else{
							regions.push({
								mainTile: candidate,
								tiles: [candidate],
								anchorTiles: [],
								params: getRandomElevationGenerationParams()
							});
							break;
						}
					}
					while (true);
				}

				//Set each regions tiles
				setRegionTiles(regions);
				//For each region, set the anchor tiles
				regions.forEach(r => r.setRegionAnchorTiles());
				var anchorTiles = regions.reduce((allAnchors, r) => {return allAnchors.concat(r.anchorTiles)}, []);
			});
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











