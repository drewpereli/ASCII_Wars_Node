
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
					numAnchorTiles: rand(5) + 15,
					minElevation: rand(80) + 0,
					elevationRange: rand(70) + 20,
					smoothness: (rand(6000) + 3000) / 10000,
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
					var region = regionCandidates[rand(regionCandidates.length)];
					//Add this tile to the regions tiles
					region.tiles.push(t);
					t.region = regions.indexOf(region);
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
					candidate.setElevation(rand(region.params.elevationRange) + region.params.minElevation);
					if (config.debug.debugMode){
						if (config.debug.showAnchorTiles){
							candidate.isAnchor = true;
						}
					}
				}
			}
			var setElevations = regions => {
				var anchorTiles = regions.reduce((allAnchors, r) => {return allAnchors.concat(r.anchorTiles)}, []);
				this.forEachTile(t => {
					if (anchorTiles.includes(t)){
						return;
					}
					//Get weighted average of elevations of anchor tiles weighted by 1 / distance to t
					var total = 0;
					var totalElevation = 0;
					anchorTiles.forEach(anchorTile => {
						var d = anchorTile.getDistance(t);
						var smoothness = regions[t.region].params.smoothness
						var weight = Math.pow(smoothness, d); //As d increases, weight decreases. 
						total += weight;
						totalElevation += weight * anchorTile.elevation;
					});
					t.setElevation(Math.round(totalElevation / total));
				});
			}
			var smoothElevations = () => {
				var smoothingIterations = 6;
				for (var i = 0 ; i < smoothingIterations ; i++){
					this.forEachTile(t => {
						//Get average elevation of containing 9 tile square
						var average = (t.siblings.reduce((sum, sib) => {return sum + sib.elevation;}, 0) + t.elevation) / 9;
						if (average > t.elevation){
							t.setElevation(t.elevation + 1);
						}
						else if (average < t.elevation){
							t.setElevation(t.elevation - 1);
						}
					});
				}
			}
			

			return new Promise((resolve, reject) => {
				//Break up map into regions
				//Each region will have different genereation paramaters
				var numRegions = Math.round(this.width * this.height / 3000);
				console.log(numRegions);
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
				regions.forEach(r => setRegionAnchorTiles(r));
				setElevations(regions);
				smoothElevations();
				resolve();
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
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			//For now just set random elevations
			setElevations()
			.then(() => {
				//return addWater();
				return Promise.resolve();
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











