class Map
	constructor: ->
		@height = config.model.map.height
		@width = config.model.map.width
		@tiles = []
		for y in [0..@height]
			@tiles.push([])
			for x in [0..@width]
				@tiles[y].push(new Tile(x, y))


	update: (mapInfo) -> 
		for tile in mapInfo.changedTiles
			@tiles[tile.y][tile.x] = tile
	


	getTile: (x, y) ->
		if 0 <= x < @width and 0 <= y < @height
			return @tiles[y][x]
		return false
