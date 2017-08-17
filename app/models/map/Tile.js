
const config = require('../../../config');
var Model = require('../Model.abstract');
const rand = require('random-seed').create();

class Tile extends Model{
	constructor(map, x, y) {
		super();

		this.map = map;
		this.x = x;
		this.y = y;

		this.terrain = 'plains';
		this.elevation = 50;
		this.waterDepth = 0;
		this.nextTurnsWaterDepth = false;

		this.region = false;
		this.actor = false;

		this.siblings = [];

		this.clientFacingFields = ['x', 'y', 'terrain', 'elevation', 'actor', 'waterDepth'];

		//Debug
		if (config.debug.debugMode){
			if (config.debug.showTileRegions){
				this.clientFacingFields.push('region');
			}
			if (config.debug.showAnchorTiles){
				this.isAnchor = false;
				this.clientFacingFields.push('isAnchor');
			}
		}
	}


	prepareFluidFlow(){
		//If the tile has no water, do nothing
		//Get sibs. 
		//If none of them have surface elevation lower than this surface elevation - 1, continue
		//Else, find tile with lowest elevation + waterdepth and move one water from this to that tile
		//If there is more than one tile tied for lowest elevation + waterdepth, pick one randomly
		if (this.waterDepth === 0)
			return;
		var lowerSibs = this.siblings.filter((t) => t.getSurfaceElevation() < this.getSurfaceElevation() - 1);
		if (lowerSibs.length === 0){
			return;
		}
		var lowestSurfaceElevation = false;
		lowerSibs.forEach(t => {
			if (lowestSurfaceElevation === false || t.getSurfaceElevation() < lowestSurfaceElevation)
				lowestSurfaceElevation = t.getSurfaceElevation();
		});
		//Then get all tiles with lowest surface elevation 
		var lowestSibs = lowerSibs.filter(t => t.getSurfaceElevation() === lowestSurfaceElevation);
		//Choose randomly from lowerSibs
		var lowerSib = lowerSibs[rand(lowestSibs.length)];
		lowerSib.setNextTurnsWaterDepth(lowerSib.waterDepth + 1);
		lowerSib.prepareToGainWater();
		this.prepareToLoseWater();
	}


	processFluidFlow(){
		if (this.nextTurnsWaterDepth !== false){
			this.setWaterDepth(this.nextTurnsWaterDepth);
			this.setNextTurnsWaterDepth(false);
		}
	}


	processErosion(){
		if (this.waterDepth === 0 && this.nextTurnsWaterDepth === 1 && rand(100) <= 20){
			this.setElevation(this.elevation - 1);
		}
	}


	processEvaporation(){
		if (this.waterDepth === 0) return;
		//Evaporation is based on surface elevation
		if (rand(1000) < this.getEvaporationProbability() * 1000){
			this.evaporateWater();
		}
	}


	evaporateWater(){
		this.map.incrementCloudWater();
		this.setWaterDepth(this.waterDepth - 1);
	}


	processRain(){
		if (this.map.cloudWater === 0) return;
		if (rand(1000) < this.getRainProbability() * 1000){
			this.getRainedOn();
		}
	}


	getRainedOn(){
		this.map.decrementCloudWater();
		this.setWaterDepth(this.waterDepth + 1);
	}






	setSiblings(){
		for (var i = 0 ; i < 8 ; i++){
			this.siblings.push(this.getTileInDirAwayFrom(i, 1));
		}
	}


	setActor(actor=false){
		this.actor = actor;
	}

	unsetActor(){
		this.setActor(false);
	}

	setWaterDepth(depth){
		if (Math.round(depth) !== depth){
			throw new Error('Water depth must be an integer. Received ' + depth);
		}
		this.waterDepth = depth;
	}

	setNextTurnsWaterDepth(depth = false){
		if (Math.round(depth) !== depth && depth !== false){
			throw new Error('Next turns water depth must be an integer or false. Received ' + depth);
		}
		this.nextTurnsWaterDepth = depth;
	}

	prepareToGainWater(){
		this.setNextTurnsWaterDepth(this.waterDepth + 1);
	}

	prepareToLoseWater(){
		if (this.waterDepth === 0){
			throw new Error('Tiles with no water should not be losing water');
		}
		this.setNextTurnsWaterDepth(this.waterDepth - 1);
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


	getDistance(tile){
		var xDiff = Math.abs(tile.x - this.x) >= this.map.width / 2 ? this.map.width - Math.abs(tile.x - this.x) : tile.x - this.x;
		var yDiff = Math.abs(tile.y - this.y) >= this.map.height / 2 ? this.map.height - Math.abs(tile.y - this.y) : tile.y - this.y;
		return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
	}


	isOpen(){
		return !this.actor && this.terrain !== 'water';
	}


	setElevation(el){
		if (el > config.model.map.maxElevation)
			el = config.model.map.maxElevation;
		if (el < config.model.map.minElevation)
			el = config.model.map.minElevation;
		this.elevation = el;
	}

	getSurfaceElevation(){
		return this.elevation + this.waterDepth;
	}

	getEvaporationProbability(){
		//Should be .5 when elevation is min, and .0001 when elevation is max
		//f(el) = prop. Two points (min, .5), (max, .0001)
		//Let's y = mx + b this bitch
		// prob = m * el + b
		// maxProb = m * minEl + b
		// minProb = m * maxEl + b
		// maxProb - m * minEl = minProb - m * maxEl
		// maxProb = minProb - m * maxEl + m * minEl
		// maxProb = minProb + m * (minEl - maxEl)
		// (maxProb - minProb) / (minEl - maxEl) = m
		// b = y - mx
		var minProb = .001;
		var maxProb = .01;
		var minEl = config.model.map.minElevation + 1; //Surface elevation
		var maxEl = config.model.map.maxElevation + 10; //Surface elevation
		var m = (maxProb - minProb) / (minEl - maxEl);
		var b = maxProb - m * minEl;
		var prob = m * this.getSurfaceElevation() + b;
		return prob;
	}


	//Should be inversely correlated with evap prob
	getRainProbability(){
		return 1;
		var minProb = 0;
		var maxProb = .02;
		var minEl = config.model.map.minElevation; //Terrain elevation
		var maxEl = config.model.map.maxElevation + 10; //Surface elevation
		var m = (maxProb - minProb) / (maxEl - minEl);
		var b = maxProb - m * maxEl;
		var prob = m * this.getSurfaceElevation() + b;
		return prob;
	}

}



module.exports = Tile;




