

class View
	constructor: ->
		#These are all the ui/visual components
		@components =
			map: 
				currentX: 0 #Coordinates of top left corner
				currentY: 0
				currentZoom: 3
				layers: {}
				cells: {}
				currentCellLength: config.view.map.initialCellLength
				clickableCanvas: {}
			control: {}
			info: {}	
			message: $('.message')
		@initialize.map.canvases(this)
		@initialize.map.cells(this)
		@initialize.controlPanel.buttons(this)
		$('.tabs').tabs()


	displayMessage: (message) ->
		m = @components.message
		#If m is fading
		if m.hasClass('has-message')
			m.stop(true).css('opacity', 1)
		m.html(message)
			.addClass('has-message')
			.animate({opacity: 1}, config.view.messageFadeDelay * 1000)
			.fadeOut({
				complete: =>
					m.empty().show().removeClass('has-message')
			})



	moveMap: (dirIndex) ->
		switch dirIndex
			when 0 then @components.map.currentY -= 5
			when 1 then @components.map.currentX += 5
			when 2 then @components.map.currentY += 5
			when 3 then @components.map.currentX -= 5
		if (@components.map.currentY < 0)
			@components.map.currentY += app.map.height
		if (@components.map.currentX < 0)
			@components.map.currentX += app.map.width
		if (@components.map.currentY >= app.map.height)
			@components.map.currentY -= app.map.height
		if (@components.map.currentX >= app.map.width)
			@components.map.currentX -= app.map.width
		@updateMap();



##############################
#
#	RENDER FUNCTIONS
#
##############################

	updateMap: ->
		@clearCanvases()
		#for each cell, render based on the layer
		cells = @components.map.cells
		for layername, layer of cells
			for row, y in layer
				for cell, x in row
					tile = @getTileFromCell(cell)
					if !tile
						continue
					else
						cell.drawTile(tile)


	updateTile: (tile) -> 
		cells = @getCellsFromTile(tile);
		for cell in cells
			cell.drawTile(tile)


	clearCell: (x, y) ->
		cells = @components.map.cells;
		for layername, layer of cells
			layer[y][x].clear()


	clearCanvases: ->
		for layername, layer of @components.map.layers
			layer.clearRect(
				0, 
				0, 
				config.view.map.width * @components.map.currentCellLength, 
				config.view.map.height * @components.map.currentCellLength
			)


	getTileFromPixels: (x, y)-> 
		cellX = Math.floor(x / @components.map.currentCellLength)
		cellY = Math.floor(y / @components.map.currentCellLength)
		return @getTileFromCellCoordinates(cellX, cellY)


	getTileFromCell: (cell) ->
		return @getTileFromCellCoordinates(cell.x, cell.y)


	getCellsFromTile: (tile) ->
		if config.debug.debugMode and config.debug.setViewDimensionsToMapDimensions
			x = (app.map.width + tile.x - @components.map.currentX) % app.map.width
			y = (app.map.height + tile.y - @components.map.currentY) % app.map.height
			cells = []

			for layername, layer of @components.map.cells
				cells.push(layer[y][x])
			return cells
		else
			throw new Error('This function doesn\'t work without debug mode stuff yet');
		


	getTileFromCellCoordinates: (x, y) ->
		app.map.getTile((x + @components.map.currentX) % app.map.width, (y + @components.map.currentY) % app.map.height)


	getColorFromElevation: (el) ->
		#Assume max elevation is 100, min is 0
		green = Math.round(el / 100 * 255)
		red = 255 - green
		greenHex = green.toString(16)
		redHex = red.toString(16)
		if greenHex.length is 1
			greenHex = '0' + greenHex
		if redHex.length is 1
			redHex = '0' + redHex
		#Return hex code
		"##{redHex}#{greenHex}00"

	getPlayerColor: (clientFacingPlayer) -> 
		return config.view.colors.players[clientFacingPlayer.team - 1]



##############################
#
#	INITIALIZER FUNCTIONS
#
##############################

View.prototype.initialize = 
	map:
		canvases: (v) ->
			$('#canvas-container').css('height', config.view.map.height * config.view.map.initialCellLength)
			for layerName in config.view.map.layers
				c = $("<canvas>").addClass(layerName)
				c.attr('width', config.view.map.width * config.view.map.initialCellLength)
					.attr('height', config.view.map.height * config.view.map.initialCellLength)
					.css('width', "#{config.view.map.width * config.view.map.initialCellLength}px")
					.css('height', "#{config.view.map.height * config.view.map.initialCellLength}px")
				v.components.map.layers[layerName] = c[0].getContext('2d')
				c.appendTo("#canvas-container")
			v.components.map.clickableCanvas = $('canvas.graphics')[0]
		cells: (v) ->
			for layer in config.view.map.layers
				v.components.map.cells[layer] = [];
				for y in [0..(config.view.map.height - 1)]
					v.components.map.cells[layer][y] = [];
					for x in [0..(config.view.map.width - 1)]
						v.components.map.cells[layer][y][x] = new Cell(x, y, v.components.map.layers[layer])
	controlPanel:
		buttons: (v) -> 
			for buildingName, building of config.model.actors.buildings.producers
				$("<div>").addClass('btn btn-default create-building-btn')
					.data('building', buildingName)
					.html(building.readableName)
					.appendTo("#construct-tab .buttons")





















    

	
