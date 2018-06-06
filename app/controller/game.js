const dotenv = require('dotenv');
const dotenvParseVariables = require('dotenv-parse-variables');
 
let env = dotenv.config({})
if (env.error) throw env.error;
env = dotenvParseVariables(env.parsed);
const config = require('../../config');
const Player = require('../models/player/Player');
const Map = require('../models/map/Map');

class Game{


	constructor(io) {
		this.state = 'waiting for players';
		this.players = [];
		this.spectators = [];
		this.map;
		this.io = io;
		this.ticks = 0;
		this.validGameStates = [
			'waiting for players',
			'counting down',
			'default',
			'game over'
		];


		//Temporary properties
		this.actors = [];
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
		this.emit('game start');
		//Create a new map
		this.emitMessage('Generating map');
		this.map = new Map(this);
		this.map.generate()
		.then(() => {
			this.emitMessage('Map finished generating');
			this.emitMap();
		})
		.catch( err => {
			console.log(err);
			this.emitMessage("Error generating map. Please try again later.");
		});
	}


	acceptingPlayers(){
		return ((this.state === 'waiting for players' || this.state === 'counting down') 
					&& this.players.length < config.maxPlayers);
	}


	beginGameStartCountdown(seconds){
		this.changeState('counting down');
		this.emit('game starting');
		var countDown = (second) => {
			this.emitMessage(second + ' seconds until game starts');
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
		console.log('Adding player');
		this.players.push(new Player({socket: socket, team: this.players.length, game: this}));
		this.emit('player added', this.players.length);
		//If this is at least the second player, start the game countdown if it hasn't already started
		if (this.players.length >= env.MIN_PLAYERS && this.state !== 'counting down'){
			this.beginGameStartCountdown(config.gameStartCountdownTime);
		}
	}


	addPlayerDebug(socket){
		var p = new Player({socket: socket, team: this.players.length, game: this});
		this.players.push(p);
		this.map.placeCommandCenterFor(p);
		this.emitMap();
	}


	addSpectator(socket){
		this.spectators.push({socket: socket});
		if (this.state === 'default')
			this.emitMapToSpectator(socket);
	}


	killPlayer(player){
		var playerIndex = this.players.indexOf(player);
		player.emitTo('death');
		//Kill all their actors
		this.actors.forEach(a => {
			if (a.dead) return;
			if (a.player === player) a.die();
		});
		this.players.splice(playerIndex, 1);

		//delete player.socket;
		console.log(this.players.length);
		if (this.players.length === 1) {
			console.log('game over');
			this.players[0].emitMessageTo('You won!');
			this.changeState('game over');
			setTimeout(() => {
				this.emit('game over');
			}, 
			1000);
		}
	}



	addActor(actor){
		this.actors.push(actor);
	}

	deleteActor(actor){
		this.actors.splice(this.actors.indexOf(actor), 1);
	}



	/*
	*
	* Emitter functions
	*
	*
	*/

	emit(event, data=null){
		this.io.emit(event, data);
	}


	emitMessage(message){
		if (typeof message !== 'string'){
			throw new Error('"Message" must be a string. Instead got ' + (typeof message));
		}
		this.emit('message', message);
	}


	emitMap(){
		for (var i in this.players){
			var player = this.players[i];
			var mapInfo = this.map.getClientDataFor(player);
			player.socket.emit('map updated', JSON.stringify(mapInfo));
		}
	}

	emitMapToSpectator(socket){
		var mapInfo = this.map.getSpectatorData();
		socket.emit('map updated', JSON.stringify(mapInfo));
	}

	emitTile(t){
		for (var i in this.players){
			var player = this.players[i];
			player.socket.emit('tile updated', JSON.stringify(t.getClientDataFor(player)));
		}
	}




	





	/*
	*
	* Route functions
	*
	*/
	playerReadyForNextTurn(player){
		player.readyForNextTurn = true;
		if (this.readyToTick())
			this.tick();
	}


	attemptBuildingConstruction(player, tile, buildingName){
		var success = player.attemptBuildingConstruction(tile, buildingName);
		if (success) this.emitTile(tile);
	}


	updateSquadBehaviorParams(player, squad, params){
		player.getSquad(squad).setBehaviorParams(params);
	}


	playerQuit(player){
		//Kill all actors associated with this player
		var actors = player.getActors();
		for (var i in actors){
			var actor = actors[i];
			actor.die();
			this.deleteActor(actor);
		}
		this.players.splice(this.players.indexOf(player), 1);
	}





	/*
	*
	* Time functions
	*
	*/
	tick(){
		this.processFluidTick();
		this.processActorTicks();
		this.ticks++;
		this.emitMap();
		//Find each player not in the playing time state and set 'readyForNextTurn' to false
		this.players.forEach((p) => {
			p.readyForNextTurn = false;
		});
	}



	processActorTicks(){
		var untickedActors = this.getActors();
		while (untickedActors.length > 0){
			var actor = untickedActors.shift();
			if (actor.dead)
				continue;
			actor.tick();
		}
	}

	processFluidTick(){
		//Process evaporation
		this.map.forEachTile(t => {
			t.processEvaporation();
		});
		//Process rain
		//Should be tiles in random order
		this.map.getRainTiles().forEach(t => {
			t.processRain();
		});
		this.map.forEachTile(t => {
			t.prepareFluidFlow(); //Prepares 'nextTurnsWaterDepth'
		});
		this.map.forEachTile(t => {
			t.processFluidFlow(); //Sets 'waterDepth' to 'nextTurnsWaterDepth', and 'nextTurnsWaterDepth' to null
		});
	}


	readyToTick(){
		//Search for a player that is not ready for the next turn
		//If we find one, return false
		return !this.players.find((p) => !p.readyForNextTurn);
	}







	/*
	*
	* getters and setters
	*
	*/
	getActors(){
		//Get actors for this game from the database
		return this.actors.slice();
	}

	setActors(a){
		this.actors = a;
	}

	getCommandCenters(){
		//Get command centers from the database
		return this.getActors().filter(a => a.type === 'CommandCenter');
	}

	setCommandCenters(c){
		this.commandCenters = c;x
	}


	getNumPlayers(){
		return this.players.length;
	}




	/*
	*
	* Debugging Functions
	*
	*/
	restart(){
		console.log('Restarting....');
		for (var i in this.players){
			var player = this.players[i];
			var actors = player.getActors();
			for (var i in actors){
				var actor = actors[i];
				actor.die();
				this.deleteActor(actor);
			}
			//this.players.splice(this.players.indexOf(player), 1);
		}
		this.start();
	}

}



module.exports = (io) => {
	return new Game(io);
}








