
class Cell
	constructor: (@x, @y, @layer) ->
		@cleared = true

	fill: (color, opacity=1) ->
		@clear() unless @cleared
		color = hexToRGBA(color, opacity) unless opacity is 1
		@layer.fillStyle = color
		x = @getXPixel()
		y = @getYPixel()
		l = @getCellLength()
		@layer.fillRect(x, y, l, l)
		@cleared = false

	clear: ->
		x = @getXPixel()
		y = @getYPixel()
		l = @getCellLength()
		@layer.clearRect(x,y,l,l)

	getCellLength: ->
		app.view.components.map.currentCellLength

	getXPixel: ->
		@getCellLength() * @x

	getYPixel: ->
		@getCellLength() * @y
