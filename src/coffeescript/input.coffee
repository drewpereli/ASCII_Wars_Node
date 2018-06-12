
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

		

		$('#digging-checkbox').change( => 
			app.game.clickDiggingCheckbox($('#digging-checkbox').is(':checked'))
		)

		$('#digging-direction-select').change( => 
			app.game.changeDiggingDirection($('#digging-direction-select').val())
		)

		$('.alignment-selection').change( =>
			app.game.changeSquadAlignment($('.alignment-selection:checked').val())
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




	getTileFromEvent: (event) ->

		cellX = Math.floor(event.offsetX / app.view.components.map.currentCellLength);
		cellY = Math.floor(event.offsetY / app.view.components.map.currentCellLength);
		x = (cellX + app.view.components.map.currentX) % app.map.width
		y = (cellY + app.view.components.map.currentY) % app.map.height
		return {x: x, y: y}
		#return app.view.getTileFromPixels(event.offsetX, event.offsetY)
		###
		x = new Number()
		y = new Number()
		canvas = app.view.components.map.clickableCanvas
		if event.x != undefined && event.y != undefined
			x = event.x
			y = event.y
		else #Firefox method to get the position
			x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
			y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop
		x -= canvas.offsetLeft
		y -= canvas.offsetTop
		return app.view.getTileFromPixels(x, y)
		###



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





