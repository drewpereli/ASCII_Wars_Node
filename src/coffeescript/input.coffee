
class Input

	constructor: ->

		$(app.view.components.map.clickableCanvas).mousedown((e) => 
			app.game.clickTile(@getTileClicked(e))
		)

		$("#next-btn").click( =>
			app.game.next()
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
