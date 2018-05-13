
var config = {
	gameStartCountdownTime: 0, //In seconds
	maxPlayers: 2,
	tickTime: 0, //In milliseconds
	maxSquads: 100,
	model: {
		map: {
			height: 50,
			width: 50,
			maxElevation: 100,
			minElevation: 0
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
						readableName: 'Residential Area',
						character: 'R'
					}
				},
				logistics: {
					Wall: {
						readableName: 'Wall',
						character: 'W'
					},
					WaterPump: {
						readableName: 'Water Pump',
					}
				}
			}
		}
	},
	view: {
		colors: {
			black: '#000',
			cellBorder: 'gray',
			selectedTileBorder: 'gold',
			terrain: {
				water: '#007',
				forest: '#070',
				desert: '#0aa',
				plains: '#055',
				mountain: '#777'
			},
			players: ['black', 'white']
		},
		map: {
			height: 50,
			width: 50,
			initialCellLength: 10, //In pixels
			layers: ['terrain', 'elevation', 'water', 'actors',	'visibility', 'graphics'],
			cellBorders: false
		},
		messageFadeDelay: 3
	},
	debug: {
		debugMode: true,
		showTileRegions: false,
		showAnchorTiles: false,
		setViewDimensionsToMapDimensions: false,
		water: true,
		allTilesVisible: true,
		testActors: 0
	}
}

if (config.view.map.height > config.model.map.height)
	config.view.map.height = config.model.map.height;
if (config.view.map.width > config.model.map.width)
	config.view.map.width = config.model.map.width;

if (config.debug.debugMode){
	if (config.debug.showTileRegions){
		config.view.map.layers.push('debug');
	}
	if (config.debug.setViewDimensionsToMapDimensions){
		config.view.map.height = config.model.map.height;
		config.view.map.width = config.model.map.width;
	}
}



// Frontend
if (typeof window !== 'undefined' && window) {
    window.config = config;

// Backend
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}