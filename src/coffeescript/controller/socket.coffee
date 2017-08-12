
class Socket
	constructor: ->
		@io = io()
		@io.on('message', (message) => app.view.displayMessage(message))
		@io.on(
			'map updated', 
			((map) => 
				map = JSON.parse(map)
				app.game.updateMap(map)
			)
		)
		@io.on(
			'tile update', 
			((tile) => 
				app.view.updateTile(JSON.parse(tile))
			)
		)
		return @io