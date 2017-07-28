
var config = require('../config');
var assert = require('assert');
var models = require('require-all')({
	dirname: __dirname + '/../app/models',
	pattern: '.*.js',
	recursive: true
});


var map = new models.map.Map();

describe('Map', function() {
	describe("#generate", function(){
		it('should generate without error', function(){
			return map.generate();
		});
		it ('should have a properly populated "tiles" array', function(){
			var proper = true;
			proper &= map.tiles.length === config.model.map.height;
			proper &= map.tiles[0].length === config.model.map.width;
			assert(proper);
		})
	});
	describe('map tile helper functions should work', function(){
		var t = new models.map.Tile(null, 0, 0);
		it('#getXAway', function(){
			assert.equal(t.getXAway(0), 0);
			assert.equal(t.getXAway(5), 5);
			assert.equal(t.getXAway(5 + 30 * config.model.map.width), 5);
			assert.equal(t.getXAway(-5), config.model.map.width - 5);
		});
		it('#getYAway', function(){
			assert.equal(t.getYAway(0), 0);
			assert.equal(t.getYAway(5), 5);
			assert.equal(t.getYAway(5 + 30 * config.model.map.height), 5);
			assert.equal(t.getYAway(-5), config.model.map.height - 5);
		});
	});
	describe('map tiles should have proper siblings', function(){
		it('each tile should have 8 siblings', function(){
			var success = true;
			map.tiles.forEach((row) => {
				row.forEach( (t) => {
					success &= t.siblings.length === 8;
				})
			});
			assert(success);
		});
		it('siblings should be properly configured', function(){
			assert.equal(map.getTile(0, 0).siblings[2], map.getTile(1, 0));
			var t = map.getTile(config.model.map.width - 1, config.model.map.height - 1);
			assert.equal(t.siblings[3], map.getTile(0, 0));
		});
	});
})

/*
describe('Tile', function() {
	describe('#indexOf()', function() {
		it('should return -1 when the value is not present', function() {
			assert.equal(-1, [1,2,3].indexOf(4));
		});
	});
});
*/