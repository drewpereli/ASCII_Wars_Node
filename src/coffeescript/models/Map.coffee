class Map
	constructor: ->
		@height = config.model.map.height
		@width = config.model.map.width
		@tiles = []
		for y in [0..@height]
			@tiles.push([])
			for x in [0..@width]
				@tiles[y].push(false)


	update: (mapInfo) -> 
		#mark all tiles as invisible to start
		for row in @tiles
			for tile in row
				if tile
					tile.visible = false

		for tile in mapInfo.visibleTiles
			tile.visible = true
			#If this is the first time we have seen the tile, update all the values
			if @tiles[tile.y][tile.x] is false
				#Set default values if not sent
				if 'actor' not of tile 
					tile.actor = false
				if 'waterDepth' not of tile
					tile.waterDepth = 0
				@tiles[tile.y][tile.x] = tile
			else
				mapTile = @tiles[tile.y][tile.x]
				#Else, only changed values were sent
				if tile.resources
					if !mapTile.resources 
						mapTile.resources = tile.resources
					else
						Object.assign mapTile.resources, tile.resources
				Object.assign @tiles[tile.y][tile.x], tile

	


	getTile: (x, y) ->
		if 0 <= x < @width and 0 <= y < @height
			return @tiles[y][x]
		return false

	updateTile: (x, y, tileParams) ->
		if !@getTile(x, y) 
			return false
		Object.assign(@tiles[y][x], tileParams)
