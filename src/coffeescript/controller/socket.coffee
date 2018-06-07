
class Socket
	constructor: ->
		@io = io()
		@io.on('message', (message) => app.view.displayMessage(message))
		@io.on(
			'map updated', 
			((map) => 
				if config.logTimeStamps
					console.log Date.now(), 'Received map'
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
		@io.on('game over', () => 
			@io.close()
			app.game.end()
		)
		@io.on('death', () =>
			app.view.displayMessage('You died!!!')
			@io.close()
			app.game.end()
		)
		return @io