
class Game

	constructor: ->
		@state
		@timeState = 'paused'
		@currentlyConstructing = false


	changeState: (state) ->
		console.log('Changing state to ' + state)
		@state = state


	changeTimeState: (state) ->
		return if state is @timeState
		@timeState = state
		if @timeState is 'playing'
			app.socket.emit('next')


	################
	#
	# USER INPUT
	#
	################

	moveMap: (dirIndex) ->
		app.view.moveMap(dirIndex)

	zoom: (direction) ->
		app.view.zoom(direction)


	clickTile: (tile) ->
		if @state is 'raising elevation'
			app.socket.emit('raise elevation', tile)
		else if @state is 'lowering elevation'
			app.socket.emit('lower elevation', tile)

	next: ->
		app.socket.emit('next')

	play: ->
		@changeTimeState('playing')

	pause: -> 
		@changeTimeState('paused')

	clickCreateBuildingButton: (building) ->
		@changeState('constructing')
		@currentlyConstructing = building



	################
	#
	# SERVER RESPONSES
	#
	################

	updateMap: (map) ->
		app.map.update(map)
		app.view.updateMap()
		if @timeState is 'playing'
			app.socket.emit('next')


