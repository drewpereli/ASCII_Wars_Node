const dotenv = require('dotenv');
const dotenvParseVariables = require('dotenv-parse-variables');
let env = dotenv.config({})
if (env.error) throw env.error;
env = dotenvParseVariables(env.parsed);
const config = require('../config');
const url = require('url');
const ngrok = require('ngrok');
var app;
var io;
var game;
var socketCount = 0;

function initializeHTTPRoutes(_app){
	app = _app;
	//Home page
	app.get('/', (req, res) => {
		console.log('Request to /, socket count: ', socketCount);
		res.render('game');
	});


	app.get('/startScreen', (req, res) => {
		res.render('start');
	});


	app.get('/hostGame/', (req, res) => {
		hostGame()
		.then(gameId => {
			//res.render('hostGame', {hostUrl: url});
			console.log(gameId);
			res.render('game');
		})
		.catch(err => {
			console.log(err);
		})
	});


	app.get('/joinGame/', (req, res) => {
		res.render('joinGame');
	});
}



function initializeIORoutes(_io){
	io = _io;
	game = require('./controller/game')(io);


	io.on('connection', (socket) => {
		console.log('connecting...');
		socketCount++;
		socket.once('disconnect', (socket) => {
			console.log('Got disconnect!');
			socketCount--;
			console.log('New socket count: ', socketCount);
			//If game over
			if (socketCount === 0){
				console.log('Disconnecting ngrok tunnel');
				ngrok.disconnect();
				game = require('./controller/game')(io); //Reset game
			}
		})
		if (game.acceptingPlayers() && !authenticatePlayer(socket)){
			game.addPlayer(socket);
			initializePlayerSocketRoutes(socket);
		}
		else if (env.DEBUG_MODE){
			game.addPlayerDebug(socket);
			initializePlayerSocketRoutes(socket);
		}
		else {
			console.log('Cant add player');
			if (!game.acceptingPlayers()) console.log('Game no longer accepting players');
			else if (authenticatePlayer(socket)) console.log('You have already joined');
			else console.log('Unknown reason. Check error log?');
		}
	});
}


function deleteIORoutes(_io){
	delete _io;
}



function initializePlayerSocketRoutes(socket){

	socket.on('next', () => {
		var p = authenticatePlayer(socket);
		if (!p){
			console.log('Player is not validated');
			return;
		} 
		game.playerReadyForNextTurn(p);
	});



	socket.on('update behavior params', (params) => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		var squad = params.squad;
		delete params.squad;
		game.updateSquadBehaviorParams(p, squad, params);
	});


	socket.once('quit', () => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		game.playerQuit(p);
	});


	socket.on('construct', (params) => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		var t = game.map.getTile(params.tile.x, params.tile.y);
		game.attemptBuildingConstruction(p, t, params.building);
	});


	socket.on('update produced squad', (params) => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		var actor = game.getActorById(params.buildingId);
		if (actor && actor.producer) actor.setProducedSquad(params.squadVals[0], params.squadVals[1]); 
	})


	socket.on('update producer on off', (params) => {
		var p = authenticatePlayer(socket);
		if (!p) return;
		var actor = game.getActorById(params.buildingId);
		if (actor && actor.producer) {
			actor.setOnOff(params.producerOn); 
		}
	})


	


	if (env.DEBUG_MODE){
		var actorClasses = require('require-dir-all')(
			'models/actors', {recursive: true}
		);
		socket.on('restart', () => {
			console.log('socket restarting');
			var p = authenticatePlayer(socket);
			if (!p) return;
			game.restart();
		});

		socket.on('raise elevation', (tile) => {
			var p = authenticatePlayer(socket);
			if (!p) return;
			var t = game.map.getTile(tile.x, tile.y);
			t.setElevation(t.elevation + 50);
			game.emitTile(t);
		});

		socket.on('lower elevation', (tile) => {
			console.log('lowering elevation of tile at ' + tile.x + ', ' + tile.y);
			var p = authenticatePlayer(socket);
			if (!p) return;
			var t = game.map.getTile(tile.x, tile.y);
			t.setElevation(t.elevation - 50);
			game.emitTile(t);
		});

		socket.on('create wall', (tile) => {
			//console.log('lowering elevation of tile at ' + tile.x + ', ' + tile.y);
			var p = authenticatePlayer(socket);
			if (!p) return;
			var t = game.map.getTile(tile.x, tile.y);
			if (t.actor) return;
			game.addActor(
				new actorClasses.buildings.Wall({
					tile: t,
					player: game.players[0]
				})
			);
			game.emitTile(t);
		});

		socket.on('create water pump', (tile) => {
			//console.log('lowering elevation of tile at ' + tile.x + ', ' + tile.y);
			var p = authenticatePlayer(socket);
			if (!p) return;
			var t = game.map.getTile(tile.x, tile.y);
			if (t.actor) return;
			game.addActor(
				new actorClasses.buildings.WaterPump({
					tile: t,
					player: game.players[0],
					direction: 0
				})
			);
			game.emitTile(t);
		});

	}
}




function authenticatePlayer(socket){
	return game.getPlayerFromSocket(socket);
}


async function hostGame(){
	const hostUrl = await ngrok.connect(env.SOCKET);
	var gameId = hostUrl.substr(8).split('.')[0];
	return gameId;
}



module.exports = function(app, io){
	initializeHTTPRoutes(app);
	initializeIORoutes(io);
}





