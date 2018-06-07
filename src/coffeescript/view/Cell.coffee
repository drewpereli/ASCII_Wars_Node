

class Cell
	constructor: (@x, @y, @layer) ->
		@cleared = true
		@layer.textBaseline = 'middle'
		@layer.textAlign = 'center'

	#Fill rect, but with border
	fill: (color, opacity=1) ->
		@clear() unless @cleared
		color = hexToRGBA(color, opacity) unless opacity is 1
		@layer.fillStyle = color
		x = @getXPixel()
		y = @getYPixel()
		l = @getCellLength()
		@layer.fillRect(x-0, y-0, l+0, l+0)
		if (config.view.map.cellBorders)
			@stroke(config.view.colors.cellBorder)
		@cleared = false

	write: (char, color) ->
		l = @getCellLength()
		x = @getXPixel()
		y = @getYPixel()
		@layer.fillStyle = color
		@layer.fillText(char, @getXPixel() + @getCellLength() / 2, @getYPixel() + @getCellLength() / 2)

	stroke: (color) ->
		x = @getXPixel()
		y = @getYPixel()
		l = @getCellLength()
		@layer.fillStyle = color
		@layer.strokeRect(x + 1, y + 1, l - 2, l - 2)

	clear: ->
		x = @getXPixel()
		y = @getYPixel()
		l = @getCellLength()
		@layer.clearRect(x-0,y-0,l+0,l+0)

	drawTile: (tile) ->
		fillColor = false
		charColor = false
		borderColor = false
		char = false
		xOffset = 0
		yOffset = 0
		switch @getLayerName()
			when 'terrain'
				charColor = config.view.colors.terrain[tile.terrain]
				char = config.view.map.terrainCharacters[tile.terrain]
			when 'elevation'
				fillColor = app.view.getColorFromElevation(tile.elevation)
			when 'actors'
				if tile.actor
					a = tile.actor
					char = a.character
					charColor = app.view.getPlayerColor(a.player)
					if a.type is 'building'
						borderColor = charColor
			when 'water'
				if tile.waterDepth > 0
					fillColor = 'rgb(0, 0, ' + (255 - 10 * tile.waterDepth) + ')'
			when 'visibility'
				if !tile.visible
					fillColor = 'rgba(0,0,0,.5)'

		if config.debug.debugMode
			if config.debug.showTileRegions
				if (@getLayerName() == 'debug')
					char = tile.region
					charColor = 'black';
			if config.debug.showAnchorTiles
				if tile.isAnchor
					char = 'A'

		if fillColor
			@fill(fillColor)
		if char and charColor
			@write(char, charColor, xOffset, yOffset)
		if borderColor
			@stroke(borderColor)

	drawGhostConstruction: (character) ->
		@clear()
		color = 'rgba(0,0,0,.5)'
		@write(character, color)
		@stroke(color)

	getCellLength: ->
		app.view.components.map.currentCellLength

	getFont: ->
		@getCellLength() + 'px monospace'

	getXPixel: ->
		@getCellLength() * @x

	getYPixel: ->
		@getCellLength() * @y

	getLayerName: -> 
		mapLayers = app.view.components.map.layers
		return Object.keys(mapLayers).find( (name) => mapLayers[name] == @layer)

