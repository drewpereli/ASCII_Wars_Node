
var WaterPump = require('./WaterPump.abstract');

class WaterPumpNorth extends WaterPump{

	constructor(args){
		args.name = 'water_pump_north';
		args.readableName = 'Water Pump -- North';
		args.direction = 0;
		super(args);
	}
}


module.exports = WaterPumpNorth;