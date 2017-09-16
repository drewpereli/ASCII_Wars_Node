
class Input

	constructor: ->

		$('body').keydown((e) => 
			@processKeyDown(e)
		)

		$(app.view.components.map.clickableCanvas).mousedown((e) => 
			e.preventDefault()
			switch e.which
				when 1 then app.game.clickTile(@getTileClicked(e))
				when 3 then app.game.rightClickTile(@getTileClicked(e))
		)

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
			app.game.clickCreateBuildingButton(building)
		)




	getTileClicked: (event) ->

		return app.view.getTileFromPixels(event.offsetX, event.offsetY)
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
		event.preventDefault()
		console.log(event.key)
		switch event.key
			when "ArrowUp" then app.game.moveMap(0)
			when "ArrowRight" then app.game.moveMap(1)
			when "ArrowDown" then app.game.moveMap(2)
			when "ArrowLeft" then app.game.moveMap(3)
			when '-' then app.game.zoom('out')
			when '=' then app.game.zoom('in')





