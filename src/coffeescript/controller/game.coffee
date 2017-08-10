
class Game

	constructor: ->
		@state
		@currentlyConstructing = false

	changeState: (state) ->
		console.log('Changing state to ' + state)
		@state = state


	clickTile: (tile) ->
		if @state is 'raising elevation'
			app.socket.emit('raise elevation', tile)
		else if @state is 'lowering elevation'
			app.socket.emit('lower elevation', tile)

	next: ->
		app.socket.emit('next')

	play: ->
		app.socket.emit('play')

	pause: -> 
		app.socket.emit('pause')

	clickCreateBuildingButton: (building) ->
		@changeState('constructing')
		@currentlyConstructing = building