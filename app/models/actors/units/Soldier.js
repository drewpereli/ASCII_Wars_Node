
var Unit = require('./Unit.abstract');
var rand = require('random-seed').create();


class Soldier extends Unit{
	constructor(args){
		args.character = 's';
		args.name = 'soldier';
		args.defense = 10;
		args.damage = false;
		args.attackTime = false;
		super(args);
	}



}

module.exports = Soldier;