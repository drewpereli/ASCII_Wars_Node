
var config = {
	gameStartCountdownTime: 0, //In seconds
	maxPlayers: 1,
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
					WaterPumpNorth: {
						readableName: 'Water Pump -- North',
						character: '\u21e1'
					},
					WaterPumpEast: {
						readableName: 'Water Pump -- East',
						character: '\u21e2'
					},
					WaterPumpSouth: {
						readableName: 'Water Pump -- South',
						character: '\u21e3'
					},
					WaterPumpWest: {
						readableName: 'Water Pump -- West',
						character: '\u21e0'
					},
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
			height: 40,
			width: 40,
			initialCellLength: 13, //In pixels
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
		water: false,
		allTilesVisible: false,
		testActors: 100
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