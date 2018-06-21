
var config = {
	port: 8100,
	gameStartCountdownTime: 0, //In seconds
	maxPlayers: 3,
	tickTime: 0, //In milliseconds
	maxSquads: 100,
	model: {
		map: {
			height: 40,
			width: 40,
			maxElevation: 100,
			minElevation: 0,
			resourceTypes: ['food', 'wood', 'metal']
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
					//Key name must be the same as file/class name
					ResidentialArea: {
						readableName: 'Residential Area',
						character: 'R'
					},
					Barracks: {
						readableName: 'Barracks',
						character: 'B'
					},
				},
				logistics: {
					Wall: {
						readableName: 'Wall',
						character: 'W'
					},
					SupplyDepot: {
						readableName: 'Supply Depot',
						character: 's'
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
		},
		squads: {
			defaultBehavior: {
				behavior: 'attacking',
				movingTo: null,
				moveTowardsPointWeight: 1,
				moveTowardsSquadMatesWeight: 1,
				alignment: false,
				alignmentWeight: 10,
				diggingDirection: 0,
				resourceHarvested: 'wood',
				resourcePickup: null,
				resourceDropoff: null
			}
		}
	},
	view: {
		colors: {
			black: '#000',
			cellBorder: 'gray',
			selectedTileBorder: 'gold',
			resources: {
				wood: 'brown'
			},
			players: ['black', 'white']
		},
		map: {
			height: 30,
			width: 30,
			initialCellLength: 14, //In pixels
			layers: ['elevation', 'terrain', 'water', 'actors',	'visibility', 'graphics'],
			cellBorders: false,
			resourceCharacters: {
				wood: 'w'
			}
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
		testActors: 0,
		flatMap: true
	},
	logTimeStamps: false
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