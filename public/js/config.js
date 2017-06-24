
var config = {
	gameStartCountdownTime: 0, //In seconds
	model: {
		map: {
			height: 50,
			width: 50,
			generation: {
				iterations: 30
			}
		}
	},
	view: {
		colors: {
			black: '#000',
			terrain: {
				water: '#007',
				forest: '#070',
				desert: '#0aa',
				plains: '#055',
				mountain: '#777'
			}
		},
		map: {
			height: 20,
			width: 20,
			initialCellLength: 20, //In pixels
			layers: ['terrain', 'elevation', 'units', 'visibility', 'graphics']
		},
		messageFadeDelay: 3
	},
	foo: 'bar'
}






// Frontend
if (typeof window !== 'undefined' && window) {
    window.config = config;

// Backend
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}