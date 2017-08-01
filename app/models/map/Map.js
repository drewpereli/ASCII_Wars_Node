
const config = require('../../../config');
const rand = require('random-seed').create();
const Tile = require(__dirname + '/Tile');

var actorClasses = require('require-dir-all')(
	'../actors', {recursive: true}
);



class Map{
	constructor(game) {
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
	getClientData(team){
		return this.tiles.map(tArray => tArray.map(t => t.getClientData()));
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
		var placeCommandCenters = () => {
			return new Promise((resolve, reject) => {
				//For each player
				for (var i in this.game.players){
					var p = this.game.players[i];
					var t = this.getRandomOpenTile();
					var commandCenter = new actorClasses.buildings.CommandCenter(t);
					this.game.addActor(commandCenter);
				}
				resolve();
			});
		}
		return new Promise((resolve, reject) => {
			//For now just set random elevations
			setElevations()
			//Generate the command centers
			.then(() => {
				return placeCommandCenters();
			})
			//Done
			.then(() => {
				resolve()
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






}


module.exports = Map;











