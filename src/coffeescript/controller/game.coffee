
class Game

	constructor: ->
		@state = 'default'
		@timeState = 'paused'
		@currentlyConstructing = false
		@currentlyConstructingChar = false
		@selectedTile = null
		@hoveredTile = null
		@squads = []
		for squadNum in [1..config.maxSquads]
			squadParams = {}
			Object.assign(squadParams, config.model.squads.defaultBehaviorParams)
			@squads.push(squadParams)


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
		if @state is 'default'
			additionalTileInfo = app.map.getTile tile.x, tile.y
			if additionalTileInfo
				Object.assign tile, additionalTileInfo
			else
				tile.visible = false
			app.view.selectTile(tile)
		else if @state is 'constructing'
			app.socket.emit('construct', {tile: tile, building: @currentlyConstructing})
		else if @state is 'raising elevation'
			app.socket.emit('raise elevation', tile)
		else if @state is 'lowering elevation'
			app.socket.emit('lower elevation', tile)
		else if @state is 'creating wall'
			app.socket.emit('create wall', tile)
		else if @state is 'creating water pump'
			app.socket.emit('create water pump', tile)
		else if @state is 'setting resource pickup'
			@updateSquadParams(@getSelectedSquad(), 'resourcePickup', {x: tile.x, y: tile.y})
		else if @state is 'setting resource dropoff'
			@updateSquadParams(@getSelectedSquad(), 'resourceDropoff', {x: tile.x, y: tile.y})
		@changeState('default')


	rightClickTile: (tile) ->
		console.log('right clicking tile ' + JSON.stringify(tile))
		selectedSquad = @getSelectedSquad()
		@updateSquadParams(selectedSquad, 'movingTo', {x: tile.x, y: tile.y})

	hoverTile: (tile) ->
		if !tile
			return
		if tile is @hoveredTile 
			return
		if @state is 'constructing'
			if (@hoveredTile)
				app.view.eraseGhostConstruction(@hoveredTile)
			app.view.drawGhostConstruction(tile, @currentlyConstructingChar)
		@hoveredTile = tile

	mouseLeaveCanvas: -> 
		app.view.eraseGhostConstruction(@hoveredTile)
		@hoveredTile = null

	updateSquadParams: (squad, name, value)->
		newParams = {squad: squad}
		newParams[name] = value
		console.log 'updating squad params: ' + JSON.stringify(newParams)
		app.socket.emit('update behavior params', newParams)
		Object.assign(@squads[squad], newParams)




	updateProducedSquad: (buildingId, val1, val2) ->
		app.socket.emit(
			'update produced squad',
			{
				buildingId: buildingId,
				squadVals: [val1, val2]
			}
		)

	updateProducerOnOff: (buildingId, producerOn) ->
		app.socket.emit(
			'update producer on off',
			{
				buildingId: buildingId,
				producerOn: producerOn
			}
		)

	controlClickTile: (tile) ->

	next: ->
		app.socket.emit('next')

	play: ->
		@changeTimeState('playing')

	pause: -> 
		@changeTimeState('paused')

	clickCreateBuildingButton: (building, character) ->
		@changeState('constructing')
		@currentlyConstructing = building
		@currentlyConstructingChar = character

	getSelectedSquad: ->
		return $('#squad-select').val()


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


	updateTile: (tile) ->
		app.map.updateTile(tile.x, tile.y, tile)
		app.view.updateTile(tile)


	end: () ->
		
		redirect = -> window.location = 'http://localhost:' + config.port + '/startScreen'
		setTimeout redirect, 1000














