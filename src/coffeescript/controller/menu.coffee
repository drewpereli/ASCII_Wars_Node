$(() -> 	

	$('ul.menu > li').first().addClass('selected')

	$('ul.menu').each((index, menu) =>
		$('body').keydown((e) => 
			#If it's not down or up, ignore it
			if e.key != 'ArrowUp' && e.key != 'ArrowDown' && e.key != 'Enter'
				return
			event.preventDefault()
			if e.key is 'ArrowUp' or e.key is 'ArrowDown'
				selectedItemIndex = $(menu).find('.selected').index()
				dir = if e.key is 'ArrowUp' then 1 else -1
				numItems = $(menu).children('li').length
				newlySelectedIndex = (numItems + selectedItemIndex + dir) % numItems
				$(menu).find('.selected').removeClass('selected')
				$(menu).find('li').eq(newlySelectedIndex).addClass('selected')
			else if e.key is 'Enter'
				selectedItem = $(menu).find('.selected')
				functionName = selectedItem.data('action')
				window[functionName](selectedItem[0])
		)
	)


)