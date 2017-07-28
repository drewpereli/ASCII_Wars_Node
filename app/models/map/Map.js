
const config = require('../../../config');
const rand = require('random-seed').create();
const Tile = require(__dirname + '/Tile');
const actorClasses = require('require-all')({
	dirname: __dirname + '/../actors',
	pattern: '.*\.js',
	recursive: true
});


class Map{
	constructor() {
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
		return new Promise((resolve, reject) => {
			//For now just set random elevations
			new Promise((resolve, reject) => {
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
			//Generate the command centers
			.then(() => {
				resolve();
			})
			.catch(() => {
				reject();
			});
		});
	}






}


module.exports = Map;











