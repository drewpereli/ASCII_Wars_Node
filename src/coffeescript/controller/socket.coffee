
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
			'tile updated', 
			((tile) => 
				tile = JSON.parse(tile)
				app.game.updateTile(tile)
			)
		)
		@io.on('player added', (numPlayers) => app.view.addPlayer(numPlayers))
		@io.on('game start', () => app.view.startGame())
		return @io