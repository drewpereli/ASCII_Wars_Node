
var WaterPump = require('./WaterPump.abstract');

class WaterPumpSouth extends WaterPump{

	constructor(args){
		args.name = 'water_pump_south';
		args.readableName = 'Water Pump -- South';
		args.direction = 2;
		super(args);
	}
}


module.exports = WaterPumpSouth;