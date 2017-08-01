
class Game

	constructor: ->
		@state
		@currentlyConstructing = false

	changeState: (state) ->
		@state = state


	clickTile: (tile) ->



	next: ->
		console.log('works2')
		app.socket.emit('next')

	clickCreateBuildingButton: (building) ->
		@changeState('constructing')
		@currentlyConstructing = building