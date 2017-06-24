

class Actor{

	constructor(x, y){
		this.x = x;
		this.y = y;
		this.health = this.maxHealth; //max health must be set in child class
	}

}


module.exports = Actor;