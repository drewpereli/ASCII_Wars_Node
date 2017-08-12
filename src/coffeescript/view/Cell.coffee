

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
		@layer.fillRect(x, y, l, l)
		if (config.view.map.cellBorders)
			@layer.fillStyle = config.view.colors.cellBorder
			@layer.strokeRect(x, y, l, l)
		@cleared = false

	write: (char, color) ->
		@layer.fillStyle = color
		@layer.font = @getFont
		@layer.fillText(char, @getXPixel() + @getCellLength() / 2, @getYPixel() + @getCellLength() / 2)

	clear: ->
		x = @getXPixel()
		y = @getYPixel()
		l = @getCellLength()
		@layer.clearRect(x,y,l,l)

	drawTile: (tile) ->
		fillColor = false
		charColor = false
		char = false
		switch @getLayerName()
			when 'terrain'
				fillColor = config.view.colors.terrain[tile.terrain]
			when 'elevation'
				fillColor = app.view.getColorFromElevation(tile.elevation)
			when 'actors'
				if tile.actor
					char = tile.actor.character
					charColor = app.view.getPlayerColor(tile.actor.player)
			when 'water'
				if tile.waterDepth > 0
					fillColor = 'rgb(0, 0, ' + (255 - 10 * tile.waterDepth) + ')';

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
			@write(char, charColor)

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

