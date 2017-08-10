
var config = {
	gameStartCountdownTime: 0, //In seconds
	maxPlayers: 2,
	model: {
		map: {
			height: 60,
			width: 60,
			generation: {
				iterations: 60
			}
		},
		actors: {
			units: {
				Worker: {
					readableName: 'Worker',
					producer: 'ResidentialArea'
				}
			},
			buildings: {
				producers: {
					ResidentialArea: {
						readableName: 'Residential Area'
					}
				}
			}
		}
	},
	view: {
		colors: {
			black: '#000',
			cellBorder: 'gray',
			terrain: {
				water: '#007',
				forest: '#070',
				desert: '#0aa',
				plains: '#055',
				mountain: '#777'
			}
		},
		map: {
			height: 60,
			width: 60,
			initialCellLength: 10, //In pixels
			layers: ['terrain', 'elevation', 'actors'/*, 'visibility', 'graphics'*/]
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