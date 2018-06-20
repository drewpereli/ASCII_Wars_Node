
var Unit = require('./Unit.abstract');

class Worker extends Unit{
	constructor(args){
		args.character = 'w';
		args.name = 'worker';
		super(args);
	}
}

module.exports = Worker;





