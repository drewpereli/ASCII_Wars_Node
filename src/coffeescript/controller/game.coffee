
class Game

	constructor: ->
		@state
		@timeState = 'paused'
		@currentlyConstructing = false
		@selectedTile = null


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
		else if @state is 'creating wall'
			app.socket.emit('create wall', tile)
		else if @state is 'creating water pump'
			app.socket.emit('create water pump', tile)

	rightClickTile: (tile) ->
		console.log('right clicking tile ' + JSON.stringify(tile))
		selectedSquad = $('#squad-select').val()
		app.socket.emit(
			'update behavior params', 
			{
				squad: selectedSquad,
				movingTo: {x: tile.x, y: tile.y}
			}
		)

	clickDiggingCheckbox: (checked) ->
		selectedSquad = $('#squad-select').val()
		app.socket.emit(
			'update behavior params', 
			{
				squad: selectedSquad,
				digging: checked
			}
		)

	changeDiggingDirection: (dir) ->
		selectedSquad = $('#squad-select').val()
		app.socket.emit(
			'update behavior params', 
			{
				squad: selectedSquad,
				diggingDirection: dir
			}
		)

	controlClickTile: (tile) ->

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













