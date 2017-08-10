
class Game

	constructor: ->
		@state
		@currentlyConstructing = false

	changeState: (state) ->
		@state = state


	clickTile: (tile) ->



	next: ->
		app.socket.emit('next')

	play: ->
		app.socket.emit('play')

	pause: -> 
		app.socket.emit('pause')

	clickCreateBuildingButton: (building) ->
		@changeState('constructing')
		@currentlyConstructing = building