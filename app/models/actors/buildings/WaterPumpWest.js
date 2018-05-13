
var WaterPump = require('./WaterPump.abstract');

class WaterPumpWest extends WaterPump{

	constructor(args){
		args.name = 'water_pump_west';
		args.readableName = 'Water Pump -- West';
		args.direction = 3;
		super(args);
	}
}


module.exports = WaterPumpWest;