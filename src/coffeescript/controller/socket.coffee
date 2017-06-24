
class Socket
	constructor: ->
		@io = io()
		@io.on('message', (message) => app.view.displayMessage(message))
		@io.on(
			'map updated', 
			((map) => 
				app.map.update(map)
				app.view.updateMap()
			)
		)
		return @io