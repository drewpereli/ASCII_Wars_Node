
class Input

	constructor: ->

		@usedKeys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', '-', '='];

		$('body').keydown((e) => 
			@processKeyDown(e)
		)

		$(app.view.components.map.clickableCanvas).mousedown((e) => 
			e.preventDefault()
			switch e.which
				when 1 then app.game.clickTile(@getTileFromEvent(e))
				when 3 then app.game.rightClickTile(@getTileFromEvent(e))
		)

		$(app.view.components.map.clickableCanvas).mousemove((e) => 
			app.game.hoverTile(@getTileFromEvent(e))
		)

		$(app.view.components.map.clickableCanvas).mouseleave((e) => 
			app.game.mouseLeaveCanvas()
		)


		$('#behavior > input[name="behavior"]').change( => 
			app.game.updateSquadParams(@getSelectedSquad(), 'behavior', $('#behavior > input:checked').val())
		)
		

		$('#digging-direction-select').change( => 
			app.game.updateSquadParams(@getSelectedSquad(), 'diggingDirection', $('#digging-direction-select').val())
		)

		$('.alignment-selection').change( =>
			app.game.updateSquadParams(@getSelectedSquad(), 'alignment', $('.alignment-selection:checked').val())
		)

		#I think this prevents right clicking from opening up a menu? I dunno, it's been a bit since I wrote it
		$(app.view.components.map.clickableCanvas).contextmenu( => return false)

		$("#next-btn").click( =>
			app.game.next()
		)

		$("#play-btn").click( =>
			app.game.play()
		)

		$("#pause-btn").click( =>
			app.game.pause()
		)

		$('.create-building-btn').click((e) =>
			building = $(e.target).data('building')
			character = $(e.target).data('character')
			app.game.clickCreateBuildingButton(building, character)
		)

		$('#current-buildings').on('change', '.producer-squad-select', () -> 
			buildingId = $(this).attr('id').split('-')[3];
			#Get the values of the two select fields
			vals = $(this).parent().find('select').map(() -> return $(this).val()).get()
			app.game.updateProducedSquad(buildingId, vals[0], vals[1])
		)

		$('#current-buildings').on('change', '.producer-on-off', () -> 
			buildingId = $(this).attr('id').split('-')[0];
			producerOn = !!$(this).prop('checked')
			app.game.updateProducerOnOff(buildingId, producerOn)
		)

		$('#set-resource-pickup').click((e) => 
			app.game.changeState('setting resource pickup')
		)

		$('#set-resource-dropoff').click((e) => 
			app.game.changeState('setting resource dropoff')
		)



	getSelectedSquad: ->
		return $('#squad-select').val()



	getTileFromEvent: (event) ->
		cellX = Math.floor(event.offsetX / app.view.components.map.currentCellLength);
		cellY = Math.floor(event.offsetY / app.view.components.map.currentCellLength);
		x = (cellX + app.view.components.map.currentX) % app.map.width
		y = (cellY + app.view.components.map.currentY) % app.map.height
		return {x: x, y: y}


	processKeyDown: (event)->
		if !@usedKeys.includes(event.key)
			return
		event.preventDefault()
		switch event.key
			when "ArrowUp" then app.game.moveMap(0)
			when "ArrowRight" then app.game.moveMap(1)
			when "ArrowDown" then app.game.moveMap(2)
			when "ArrowLeft" then app.game.moveMap(3)
			when '-' then app.game.zoom('out')
			when '=' then app.game.zoom('in')





