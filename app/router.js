require('dotenv').config();
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
		//If we're the first to connect, i.e. opening up the game
		if (socketCount === 0)
			res.render('start');
		//Else we're coming in from an ngrok link
		else
			res.render('game')
	});


	app.get('/hostGame/', (req, res) => {
		hostGame()
		.then(gameId => {
			//res.render('hostGame', {hostUrl: url});
			console.log(gameId);
			res.render('game');
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
		if (game.acceptingPlayers() && !authenticatePlayer(socket.id)){
			game.addPlayer(socket);
			initializePlayerSocketRoutes(socket);
		}
		else if (process.env.DEBUG_MODE){
			game.addPlayerDebug(socket);
			initializePlayerSocketRoutes(socket);
		}
		else {
			//This is super sketchy, because you could just open a new tab and spectate, but whatevs
			game.addSpectator(socket);
			initializeSpectatorSocketRoutes(socket);
		}
	});
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


	socket.on('quit', () => {
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


	
	socket.on('disconnect', () => {
		socketCount--;
	});
	


	if (process.env.DEBUG_MODE){
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


function initializeSpectatorSocketRoutes(socket){
	socket.on('quit', () => {});
}


function authenticatePlayer(socket){
	return game.getPlayerFromSocket(socket);
}


async function hostGame(){
	const hostUrl = await ngrok.connect(process.env.SOCKET);
	var gameId = hostUrl.substr(8).split('.')[0];
	return gameId;
}


module.exports = function(app, io){
	initializeHTTPRoutes(app);
	initializeIORoutes(io);
}





