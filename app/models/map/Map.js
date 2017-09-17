
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
		this.changedTiles = [];

		this.cloudWater = 0;

		for (var y = 0 ; y < this.height ; y++){
			this.tiles.push([]);
			for (var x = 0 ; x < this.width ; x++){
				this.tiles[y].push(new Tile(this, x, y));
			}
		}
		this.setTileSiblings();
	}


	incrementCloudWater(){
		this.cloudWater++;
	}

	decrementCloudWater(){
		this.cloudWater--;
	}


	//Return top ten percent of tiles by elevation
	getRainTiles(){
		var sortedTiles = this.getTiles().sort((t1, t2) => t2.elevation - t1.elevation);
		return sortedTiles.slice(0, Math.round(sortedTiles.length / 1000));
	}


	//Gets an object containing the map data to send to the client
	getClientDataFor(player){
		return {changedTiles: this.changedTiles.map(t => t.getClientDataFor(player))};
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
		var setElevationsAndWater = () => {
			var getRandomElevationGenerationParams = () => {
				return {
					numAnchorTiles: rand(15) + 10,
					minElevation: rand(80) + 0,
					elevationRange: rand(80) + 20,
					smoothness: (rand(6000) + 3000) / 10000,
					moistureChance: (rand(70) + 30) / 100
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
				this.forEachTile((t, i) => {
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
					//get percent done
					var percentDone = 100 * i / (this.width * this.height);
					if (percentDone % 5 === 0){
						console.log(percentDone + '% done');
					}
				});
			}
			var smoothAnchorTiles = regions => {
				regions.forEach(r => {
					r.anchorTiles.forEach(t => {
						//Get average elevation of sibs
						var sum = t.siblings.reduce((sum, sib) => {return sum + sib.elevation;}, 0);
						var average = Math.round(sum / 8);
						t.setElevation(average);
					})
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

			var normalizeElevations = () => {
				var currentMin = Math.min(...this.getTiles().map(t => t.elevation));
				var currentMax = Math.max(...this.getTiles().map(t => t.elevation));
				var targetMin = config.model.map.minElevation;
				var targetMax = config.model.map.maxElevation;

				var normalize = t => {
					var newElevation = (t.elevation - currentMin) / (currentMax - currentMin) * (targetMax - targetMin);
					t.setElevation(Math.round(newElevation));
				}

				this.forEachTile(t => normalize(t));
			}

			var addWater = regions => {
				if (config.debug.debugMode && !config.debug.water){
					return Promise.resolve();
				}
				regions.forEach(r => {
					r.tiles.forEach(t => {
						if (rand(100) / 100 < r.params.moistureChance){
							t.setWaterDepth(1);
						}
					});
				});

				var flowIterations = 200;
				var erosionIterations = 100;

				var processFlow = iteration => {
					if (iteration > flowIterations){
						return Promise.resolve();
					}
					this.forEachTile(t => {
						t.prepareFluidFlow();
					});
					this.forEachTile(t => {
						t.processFluidFlow();
					});
					return processFlow(iteration + 1);
				}


				var processRainErosion = iteration => {
					if (iteration > erosionIterations){
						return Promise.resolve();
					}
					this.forEachTile(t => {
						t.processEvaporation();
					});
					//Process rain
					//Should be tiles in random order
					this.getRainTiles().forEach(t => {
						t.processRain();
					});
					this.forEachTile(t => {
						t.prepareFluidFlow();
					});
					//Proces erosion
					this.forEachTile(t => {
						t.processErosion();
					})
					this.forEachTile(t => {
						t.processFluidFlow();
					});
					return processRainErosion(iteration + 1);
				}

				return new Promise((resolve, reject) => {
					processFlow(0)
					.then(() => processRainErosion(0))
					.then(() => resolve())
					.catch(err => reject(err));
				})
			} 
			

			return new Promise((resolve, reject) => {
				//Break up map into regions
				//Each region will have different genereation paramaters
				var numRegions = Math.round(this.width * this.height / 1000);
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
				console.log('setting region tiles...');
				setRegionTiles(regions);
				//For each region, set the anchor tiles
				console.log('setting region anchor tiles');
				regions.forEach(r => setRegionAnchorTiles(r));
				console.log('setting elevation');
				setElevations(regions);
				console.log('smoothing anchor tiles');
				smoothAnchorTiles(regions);
				console.log('smoothing elevations');
				smoothElevations();
				console.log('normalizing elevations');
				normalizeElevations();
				console.log('adding water');
				addWater(regions)
				.then(() => resolve())
				.catch(err => reject(err));
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
		
		return new Promise((resolve, reject) => {
			//For now just set random elevations
			setElevationsAndWater()
			//Generate the command centers
			.then(() => {
				console.log('water added');
				return placeCommandCenters();
			})
			//Done
			.then(() => {
				for (var i = 0 ; i < 300 ; i++){
					//Place a random unit
					this.game.addActor(
						new actorClasses.Unit({
							tile: this.getRandomOpenTile(), 
							player: this.game.players[0],
							squad: 0
						})
					);
				}
				
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
		var count = 0;
		for (var i in this.tiles){
			var row = this.tiles[i];
			for (var j in row){
				var tile = row[j];
				count++;
				func(tile, count);
			}
		}
	}


	getShuffledTiles(){
		var tiles = this.getTiles();
		var shuffled = [];
		do{
			var index = rand(tiles.length);
			shuffled.push(tiles[index]);
			tiles.splice(index, 1);
		}
		while(tiles.length > 0);
		return shuffled;
	}


	getTiles(){
		return this.tiles.reduce((all, row) => {return all.concat(row);}, []);
	}




}


module.exports = Map;











