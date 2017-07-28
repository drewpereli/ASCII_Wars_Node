
const config = require('../../../config');

class Tile{
	constructor(map, x, y) {
		this.map = map;
		this.x = x;
		this.y = y;
		this.terrain = 'water';
		this.elevation = 0;
		this.siblings = [];
	}

	setSiblings(){
		for (var i = 0 ; i < 8 ; i++){
			this.siblings.push(this.getTileInDirAwayFrom(i, 1));
		}
	}


	/*
	*
	* Helper functions
	*
	*/

	//Distance is potentially a little misleading here
	//It's not the euclidean distance, but rather the distance in the x and y directions we will step
	getTileInDirAwayFrom(direction, distance){
		var xDiff = 0;
		var yDiff = 0;
		switch (direction){
			case 0:
				yDiff = -1;
				break;
			case 1: 
				yDiff = -1;
				xDiff = 1;
				break;
			case 2: 
				xDiff = 1;
				break;
			case 3: 
				xDiff = 1;
				yDiff = 1;
				break;
			case 4:
				yDiff = 1;
				break;
			case 5:
				yDiff = 1;
				xDiff = -1;
				break;
			case 6:
				xDiff = -1;
				break;
			case 7:
				xDiff = -1;
				yDiff = -1;
				break;
		}
		return this.map.getTile(this.getXAway(xDiff * distance), this.getYAway(yDiff * distance));
	}


	getXAway(distance){
		var x = this.x + distance;
		if (x >= 0){
			return x % config.model.map.width;
		}
		return config.model.map.width - ((-1 * x) % config.model.map.width);
	}


	getYAway(distance){
		var y = this.y + distance;
		if (y >= 0){
			return y % config.model.map.height;
		}
		return config.model.map.height - ((-1 * y) % config.model.map.height);
	}
}



module.exports = Tile;