
class Player{
	constructor(socket){
		this.socket = socket;
		this.readyForNextTurn = false;
		this.timeState = 'paused'; //Paused or playing
	}
}

module.exports = Player;