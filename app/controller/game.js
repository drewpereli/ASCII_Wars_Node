require('dotenv').config();
const config = require('../../config');
const Player = require('../models/player');
const Map = require('../models/map');

class Game{


	constructor(io) {
		this.state = 'waiting for players';
		this.players = [];
		this.spectators = [];
		this.actors = [];
		this.map;
		this.io = io;
		this.ticks = 0;
		this.validGameStates = [
			'waiting for players',
			'counting down',
			'default',
			'ending'
		];
	}


	changeState(state){
		if (!this.validGameStates.includes(state)){
			throw new Error('Invalid game state: ' + state);
			return;
		}
		this.state === state;
	}


	start() {
		this.changeState('default');
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
			this.sendMessage("Error generating map. Please try again later.");
		})
	}


	acceptingPlayers(){
		return this.state === 'waiting for players' || this.state === 'counting down';
	}


	beginGameStartCountdown(seconds){
		this.changeState('counting down');
		var countDown = (second) => {
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
		return player ? player : false;
	}


	addPlayer(socket){
		this.players.push(new Player(socket));
		//If this is at least the second player, start the game countdown if it hasn't already started
		if (this.players.length >= process.env.MIN_PLAYERS && this.state !== 'counting down'){
			this.beginGameStartCountdown(config.gameStartCountdownTime);
		}
	}


	addSpectator(socket){
		this.spectators.push({socket: socket});
		if (this.state === 'default')
			socket.emit('map updated', this.map.tiles);
	}


	sendMessage(message){
		this.io.emit('message', message);
	}




	processFluidTick(){}





	/*
	*
	* Route functions
	*
	*/
	playerReadyForNextTurn(player){
		//If the player is alrady in the "play" time state, we don't have to do anything
		if (player.timeState === 'playing')
			return;
		player.readyForNextTurn = true;
		if (this.readyToTick())
			this.tick();
	}


	changePlayerTimeState(player, timeState){
		if (!['playing', 'paused'].includes(timestate))
			throw new Error("Time state must be 'playing' or 'paused'. '" + timeState + "' given");
		player.timeState = timeState;
	}


	updateSquadBehaviorParams(player, params){}


	playerQuit(player){}





	/*
	*
	* Time functions
	*
	*/
	tick(){
		this.processFluidTick();
		var untickedActors = this.actors;
		while (untickedActors.length > 0){
			var actor = untickedActors.shift();
			if (actor.dead)
				continue;
			actor.tick();
		}

		this.ticks++;

		if (this.allPlayersInPlayingTimeState())
			setTimeout(this.tick, 0);
	}


	readyToTick(){
		//Search for a player that is not ready for the next turn
		//If we find one, return false
		return !this.players.find((p) => !p.readyForNextTurn);
	}


	//Returns true if all of the players have hit "play" and haven't hit pause
	allPlayersInPlayingTimeState(){
		return !this.players.find((p) => p.timeState !== 'playing');
	}





	/*
	*
	* Magic getters and setters
	*
	*/
	get actors(){
		//Get actors for this game from the database
	}


	get numPlayers(){
		return this.players.length;
	}


}



module.exports = (io) => {
	return new Game(io);
}








