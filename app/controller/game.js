const config = require('../../config');
const Map = require('../model/map');

class Game{


	constructor(io) {
		this.state = 'waiting for players';
		this.players = [];
		this.spectators = [];
		this.actors = [];
		this.map;
		this.io = io;
	}


	start() {
		this.state = 'default';
		//Create a new map
		this.sendMessage('Generating map');
		this.map = new Map();
		this.map.generate()
		.then( data => {
			this.sendMessage('Map finished generating');
			this.io.emit('map updated', this.map.tiles);
		})
		.catch( err => {
			console.log(err);
		})
	}


	acceptingPlayers(){
		return this.state === 'waiting for players' || this.state === 'counting down';
	}


	beginGameStartCountdown(seconds){
		this.state = 'counting down';
		var countDown = (second) => {
			console.log(second);
			this.sendMessage(second + ' seconds until game starts');
			if (second === 0){
				this.start();
				return;
			}
			setTimeout(() => {countDown(second - 1);}, 1000);
		}
		countDown(seconds);
	}


	getPlayerFromSocket(socket){
		var player = this.players.find((p) => p.socket === socket);
		if (!player)
			return false;
	}


	addPlayer(socket){
		this.players.push({socket: socket});
	}


	addSpectator(socket){
		this.spectators.push({socket: socket});
		if (this.state === 'default')
			socket.emit('map updated', this.map.tiles);
	}



	sendMessage(message){
		this.io.emit('message', message);
	}
}



module.exports = (io) => {
	return new Game(io);
}