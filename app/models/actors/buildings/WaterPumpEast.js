
var WaterPump = require('./WaterPump.abstract');

class WaterPumpEast extends WaterPump{

	constructor(args){
		args.name = 'water_pump_east';
		args.readableName = 'Water Pump -- East';
		args.direction = 1;
		super(args);
	}
}


module.exports = WaterPumpEast;