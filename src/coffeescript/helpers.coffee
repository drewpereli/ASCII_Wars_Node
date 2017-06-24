
hexToRGBA = (hex, opacity = 1) ->
	c = hexToRGBAComponents hex, opacity #components
	"rgba(#{c.join(',')})"

hexToRGBAComponents = (hex, opacity = 1) ->
	hex = hex.replace(/^#/, '')
	if hex.length == 3
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
	num = parseInt(hex, 16)
	[num >> 16, num >> 8 & 255, num & 255, opacity]

