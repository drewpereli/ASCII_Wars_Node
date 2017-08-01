

class Actor{

	constructor({}){
		this.x = x;
		this.y = y;
		this.health = this.maxHealth; //max health must be set in child class
		this.dead = false;
		this.timeUntilNextAction = 0;
	}


	tick(){
		this.timeUntilNextAction--;
		if (this.timeUntilNextAction === 0)
			this.act();
	}


	act(){}

}


module.exports = Actor;