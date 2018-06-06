var app;

app = {
  game: null,
  map: null,
  view: null,
  input: null,
  socket: null
};

var Game;

Game = class Game {
  constructor() {
    this.state;
    this.timeState = 'paused';
    this.currentlyConstructing = false;
    this.currentlyConstructingChar = false;
    this.selectedTile = null;
    this.hoveredTile = null;
  }

  changeState(state) {
    console.log('Changing state to ' + state);
    return this.state = state;
  }

  changeTimeState(state) {
    if (state === this.timeState) {
      return;
    }
    this.timeState = state;
    if (this.timeState === 'playing') {
      return app.socket.emit('next');
    }
  }

  //###############

  // USER INPUT

  //###############
  moveMap(dirIndex) {
    return app.view.moveMap(dirIndex);
  }

  zoom(direction) {
    return app.view.zoom(direction);
  }

  clickTile(tile) {
    if (this.state === 'constructing') {
      return app.socket.emit('construct', {
        tile: tile,
        building: this.currentlyConstructing
      });
    } else if (this.state === 'raising elevation') {
      return app.socket.emit('raise elevation', tile);
    } else if (this.state === 'lowering elevation') {
      return app.socket.emit('lower elevation', tile);
    } else if (this.state === 'creating wall') {
      return app.socket.emit('create wall', tile);
    } else if (this.state === 'creating water pump') {
      return app.socket.emit('create water pump', tile);
    }
  }

  rightClickTile(tile) {
    var selectedSquad;
    console.log('right clicking tile ' + JSON.stringify(tile));
    selectedSquad = $('#squad-select').val();
    return app.socket.emit('update behavior params', {
      squad: selectedSquad,
      movingTo: {
        x: tile.x,
        y: tile.y
      }
    });
  }

  hoverTile(tile) {
    if (!tile) {
      return;
    }
    if (tile === this.hoveredTile) {
      return;
    }
    if (this.state === 'constructing') {
      if (this.hoveredTile) {
        app.view.eraseGhostConstruction(this.hoveredTile);
      }
      app.view.drawGhostConstruction(tile, this.currentlyConstructingChar);
    }
    return this.hoveredTile = tile;
  }

  mouseLeaveCanvas() {
    app.view.eraseGhostConstruction(this.hoveredTile);
    return this.hoveredTile = null;
  }

  clickDiggingCheckbox(checked) {
    var selectedSquad;
    selectedSquad = $('#squad-select').val();
    return app.socket.emit('update behavior params', {
      squad: selectedSquad,
      digging: checked
    });
  }

  changeDiggingDirection(dir) {
    var selectedSquad;
    selectedSquad = $('#squad-select').val();
    return app.socket.emit('update behavior params', {
      squad: selectedSquad,
      diggingDirection: dir
    });
  }

  changeSquadAlignment(alignment) {
    var selectedSquad;
    if (alignment === 'none') {
      alignment = false;
    }
    selectedSquad = $('#squad-select').val();
    return app.socket.emit('update behavior params', {
      squad: selectedSquad,
      alignment: alignment
    });
  }

  controlClickTile(tile) {}

  next() {
    return app.socket.emit('next');
  }

  play() {
    return this.changeTimeState('playing');
  }

  pause() {
    return this.changeTimeState('paused');
  }

  clickCreateBuildingButton(building, character) {
    this.changeState('constructing');
    this.currentlyConstructing = building;
    return this.currentlyConstructingChar = character;
  }

  //###############

  // SERVER RESPONSES

  //###############
  updateMap(map) {
    app.map.update(map);
    app.view.updateMap();
    if (this.timeState === 'playing') {
      return app.socket.emit('next');
    }
  }

  updateTile(tile) {
    app.map.updateTile(tile.x, tile.y, tile);
    return app.view.updateTile(tile);
  }

  end() {
    var redirect;
    redirect = function() {
      return window.location = 'http://localhost:' + config.port + '/startScreen';
    };
    return setTimeout(redirect, 1000);
  }

};

$(function() {
  $('ul.menu > li').first().addClass('selected');
  return $('ul.menu').each((index, menu) => {
    return $('body').keydown((e) => {
      var dir, functionName, newlySelectedIndex, numItems, selectedItem, selectedItemIndex;
      
      //If it's not down or up, ignore it
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        selectedItemIndex = $(menu).find('.selected').index();
        dir = e.key === 'ArrowUp' ? 1 : -1;
        numItems = $(menu).children('li').length;
        newlySelectedIndex = (numItems + selectedItemIndex + dir) % numItems;
        $(menu).find('.selected').removeClass('selected');
        return $(menu).find('li').eq(newlySelectedIndex).addClass('selected');
      } else if (e.key === 'Enter') {
        selectedItem = $(menu).find('.selected');
        functionName = selectedItem.data('action');
        return window[functionName](selectedItem[0]);
      }
    });
  });
});

var Socket;

Socket = class Socket {
  constructor() {
    this.io = io();
    this.io.on('message', (message) => {
      return app.view.displayMessage(message);
    });
    this.io.on('map updated', ((map) => {
      if (config.logTimeStamps) {
        console.log(Date.now(), 'Received map');
      }
      map = JSON.parse(map);
      return app.game.updateMap(map);
    }));
    this.io.on('tile updated', ((tile) => {
      tile = JSON.parse(tile);
      return app.game.updateTile(tile);
    }));
    this.io.on('player added', (numPlayers) => {
      return app.view.addPlayer(numPlayers);
    });
    this.io.on('game start', () => {
      return app.view.startGame();
    });
    this.io.on('game over', () => {
      this.io.close();
      return app.game.end();
    });
    this.io.on('death', () => {
      app.view.displayMessage('You died!!!');
      this.io.close();
      return app.game.end();
    });
    return this.io;
  }

};

var hexToRGBA, hexToRGBAComponents;

hexToRGBA = function(hex, opacity = 1) {
  var c;
  c = hexToRGBAComponents(hex, opacity); //components
  return `rgba(${c.join(',')})`;
};

hexToRGBAComponents = function(hex, opacity = 1) {
  var num;
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  num = parseInt(hex, 16);
  return [num >> 16, num >> 8 & 255, num & 255, opacity];
};

var init;

init = function() {
  app.map = new Map();
  app.view = new View();
  app.socket = new Socket();
  app.input = new Input();
  return app.game = new Game();
};

var Input;

Input = class Input {
  constructor() {
    this.usedKeys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', '-', '='];
    $('body').keydown((e) => {
      return this.processKeyDown(e);
    });
    $(app.view.components.map.clickableCanvas).mousedown((e) => {
      e.preventDefault();
      switch (e.which) {
        case 1:
          return app.game.clickTile(this.getTileFromEvent(e));
        case 3:
          return app.game.rightClickTile(this.getTileFromEvent(e));
      }
    });
    $(app.view.components.map.clickableCanvas).mousemove((e) => {
      return app.game.hoverTile(this.getTileFromEvent(e));
    });
    $(app.view.components.map.clickableCanvas).mouseleave((e) => {
      return app.game.mouseLeaveCanvas();
    });
    $('#digging-checkbox').change(() => {
      return app.game.clickDiggingCheckbox($('#digging-checkbox').is(':checked'));
    });
    $('#digging-direction-select').change(() => {
      return app.game.changeDiggingDirection($('#digging-direction-select').val());
    });
    $('.alignment-selection').change(() => {
      return app.game.changeSquadAlignment($('.alignment-selection:checked').val());
    });
    $(app.view.components.map.clickableCanvas).contextmenu(() => {
      return false;
    });
    $("#next-btn").click(() => {
      return app.game.next();
    });
    $("#play-btn").click(() => {
      return app.game.play();
    });
    $("#pause-btn").click(() => {
      return app.game.pause();
    });
    $('.create-building-btn').click((e) => {
      var building, character;
      building = $(e.target).data('building');
      character = $(e.target).data('character');
      return app.game.clickCreateBuildingButton(building, character);
    });
  }

  getTileFromEvent(event) {
    var cellX, cellY, x, y;
    cellX = Math.floor(event.offsetX / app.view.components.map.currentCellLength);
    cellY = Math.floor(event.offsetY / app.view.components.map.currentCellLength);
    x = (cellX + app.view.components.map.currentX) % app.map.width;
    y = (cellY + app.view.components.map.currentY) % app.map.height;
    return {
      x: x,
      y: y
    };
  }

  //return app.view.getTileFromPixels(event.offsetX, event.offsetY)
  /*
  x = new Number()
  y = new Number()
  canvas = app.view.components.map.clickableCanvas
  if event.x != undefined && event.y != undefined
  	x = event.x
  	y = event.y
  else #Firefox method to get the position
  	x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
  	y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop
  x -= canvas.offsetLeft
  y -= canvas.offsetTop
  return app.view.getTileFromPixels(x, y)
  */
  processKeyDown(event) {
    if (!this.usedKeys.includes(event.key)) {
      return;
    }
    event.preventDefault();
    switch (event.key) {
      case "ArrowUp":
        return app.game.moveMap(0);
      case "ArrowRight":
        return app.game.moveMap(1);
      case "ArrowDown":
        return app.game.moveMap(2);
      case "ArrowLeft":
        return app.game.moveMap(3);
      case '-':
        return app.game.zoom('out');
      case '=':
        return app.game.zoom('in');
    }
  }

};

var Map;

Map = class Map {
  constructor() {
    var i, j, ref, ref1, x, y;
    this.height = config.model.map.height;
    this.width = config.model.map.width;
    this.tiles = [];
    for (y = i = 0, ref = this.height; (0 <= ref ? i <= ref : i >= ref); y = 0 <= ref ? ++i : --i) {
      this.tiles.push([]);
      for (x = j = 0, ref1 = this.width; (0 <= ref1 ? j <= ref1 : j >= ref1); x = 0 <= ref1 ? ++j : --j) {
        this.tiles[y].push(false);
      }
    }
  }

  update(mapInfo) {
    var i, j, k, len, len1, len2, ref, ref1, results, row, tile;
    ref = this.tiles;
    for (i = 0, len = ref.length; i < len; i++) {
      row = ref[i];
      for (j = 0, len1 = row.length; j < len1; j++) {
        tile = row[j];
        if (tile) {
          tile.visible = false;
        }
      }
    }
    ref1 = mapInfo.visibleTiles;
    results = [];
    for (k = 0, len2 = ref1.length; k < len2; k++) {
      tile = ref1[k];
      tile.visible = true;
      results.push(this.tiles[tile.y][tile.x] = tile);
    }
    return results;
  }

  getTile(x, y) {
    if ((0 <= x && x < this.width) && (0 <= y && y < this.height)) {
      return this.tiles[y][x];
    }
    return false;
  }

  updateTile(x, y, tileParams) {
    if (!this.getTile(x, y)) {
      return false;
    }
    return Object.assign(this.tiles[y][x], tileParams);
  }

};

var Tile;

Tile = class Tile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.terrain = 'water';
    this.elevation = 0;
    this.actor = false;
  }

};

var Cell;

Cell = class Cell {
  constructor(x1, y1, layer) {
    this.x = x1;
    this.y = y1;
    this.layer = layer;
    this.cleared = true;
    this.layer.textBaseline = 'middle';
    this.layer.textAlign = 'center';
  }

  //Fill rect, but with border
  fill(color, opacity = 1) {
    var l, x, y;
    if (!this.cleared) {
      this.clear();
    }
    if (opacity !== 1) {
      color = hexToRGBA(color, opacity);
    }
    this.layer.fillStyle = color;
    x = this.getXPixel();
    y = this.getYPixel();
    l = this.getCellLength();
    this.layer.fillRect(x - 0, y - 0, l + 0, l + 0);
    if (config.view.map.cellBorders) {
      this.stroke(config.view.colors.cellBorder);
    }
    return this.cleared = false;
  }

  write(char, color) {
    var l, x, y;
    l = this.getCellLength();
    x = this.getXPixel();
    y = this.getYPixel();
    this.layer.fillStyle = color;
    return this.layer.fillText(char, this.getXPixel() + this.getCellLength() / 2, this.getYPixel() + this.getCellLength() / 2);
  }

  stroke(color) {
    var l, x, y;
    x = this.getXPixel();
    y = this.getYPixel();
    l = this.getCellLength();
    this.layer.fillStyle = color;
    return this.layer.strokeRect(x + 1, y + 1, l - 2, l - 2);
  }

  clear() {
    var l, x, y;
    x = this.getXPixel();
    y = this.getYPixel();
    l = this.getCellLength();
    return this.layer.clearRect(x - 0, y - 0, l + 0, l + 0);
  }

  drawTile(tile) {
    var a, borderColor, char, charColor, fillColor, xOffset, yOffset;
    fillColor = false;
    charColor = false;
    borderColor = false;
    char = false;
    xOffset = 0;
    yOffset = 0;
    switch (this.getLayerName()) {
      case 'terrain':
        fillColor = config.view.colors.terrain[tile.terrain];
        break;
      case 'elevation':
        fillColor = app.view.getColorFromElevation(tile.elevation);
        break;
      case 'actors':
        if (tile.actor) {
          a = tile.actor;
          char = a.character;
          charColor = app.view.getPlayerColor(a.player);
          if (a.type === 'building') {
            borderColor = charColor;
          }
        }
        break;
      case 'water':
        if (tile.waterDepth > 0) {
          fillColor = 'rgb(0, 0, ' + (255 - 10 * tile.waterDepth) + ')';
        }
        break;
      case 'visibility':
        if (!tile.visible) {
          fillColor = 'rgba(0,0,0,.5)';
        }
    }
    if (config.debug.debugMode) {
      if (config.debug.showTileRegions) {
        if (this.getLayerName() === 'debug') {
          char = tile.region;
          charColor = 'black';
        }
      }
      if (config.debug.showAnchorTiles) {
        if (tile.isAnchor) {
          char = 'A';
        }
      }
    }
    if (fillColor) {
      this.fill(fillColor);
    }
    if (char && charColor) {
      this.write(char, charColor, xOffset, yOffset);
    }
    if (borderColor) {
      return this.stroke(borderColor);
    }
  }

  drawGhostConstruction(character) {
    var color;
    this.clear();
    color = 'rgba(0,0,0,.5)';
    this.write(character, color);
    return this.stroke(color);
  }

  getCellLength() {
    return app.view.components.map.currentCellLength;
  }

  getFont() {
    return this.getCellLength() + 'px monospace';
  }

  getXPixel() {
    return this.getCellLength() * this.x;
  }

  getYPixel() {
    return this.getCellLength() * this.y;
  }

  getLayerName() {
    var mapLayers;
    mapLayers = app.view.components.map.layers;
    return Object.keys(mapLayers).find((name) => {
      return mapLayers[name] === this.layer;
    });
  }

};

var View;

View = class View {
  constructor() {
    //These are all the ui/visual components
    this.components = {
      map: {
        currentX: 0, //Coordinates of top left corner
        currentY: 0,
        currentZoom: 3,
        layers: {},
        cells: {},
        currentCellLength: config.view.map.initialCellLength,
        clickableCanvas: {},
        selectedTile: null
      },
      control: {},
      info: {},
      message: $('.message')
    };
    this.initialize.map.canvases(this);
    this.initialize.map.cells(this);
    this.initialize.controlPanel(this);
    $('.tabs').tabs();
  }

  displayMessage(message) {
    var m;
    m = this.components.message;
    //If m is fading
    if (m.hasClass('has-message')) {
      m.stop(true).css('opacity', 1);
    }
    return m.html(message).addClass('has-message').animate({
      opacity: 1
    }, config.view.messageFadeDelay * 1000).fadeOut({
      complete: () => {
        return m.empty().show().removeClass('has-message');
      }
    });
  }

  addPlayer(numPlayers) {
    this.displayMessage('Player ' + numPlayers + ' added');
    return $('#playerCount').html(numPlayers);
  }

  startGame() {
    $('#preGameScreen').addClass('hidden');
    return $('#gameScreen').removeClass('hidden');
  }

  moveMap(dirIndex) {
    switch (dirIndex) {
      case 0:
        this.components.map.currentY -= 5;
        break;
      case 1:
        this.components.map.currentX += 5;
        break;
      case 2:
        this.components.map.currentY += 5;
        break;
      case 3:
        this.components.map.currentX -= 5;
    }
    if (this.components.map.currentY < 0) {
      this.components.map.currentY += app.map.height;
    }
    if (this.components.map.currentX < 0) {
      this.components.map.currentX += app.map.width;
    }
    if (this.components.map.currentY >= app.map.height) {
      this.components.map.currentY -= app.map.height;
    }
    if (this.components.map.currentX >= app.map.width) {
      this.components.map.currentX -= app.map.width;
    }
    return this.updateMap();
  }

  updateMap() {
    var cell, cells, layer, layername, results, row, tile, x, y;
    this.clearCanvases();
    //for each cell, render based on the layer
    cells = this.components.map.cells;
    results = [];
    for (layername in cells) {
      layer = cells[layername];
      results.push((function() {
        var i, len, results1;
        results1 = [];
        for (y = i = 0, len = layer.length; i < len; y = ++i) {
          row = layer[y];
          results1.push((function() {
            var j, len1, results2;
            results2 = [];
            for (x = j = 0, len1 = row.length; j < len1; x = ++j) {
              cell = row[x];
              tile = this.getTileFromCell(cell);
              if (tile) {
                results2.push(cell.drawTile(tile));
              } else if (layername === 'visibility') {
                results2.push(cell.fill('#000'));
              } else {
                results2.push(void 0);
              }
            }
            return results2;
          }).call(this));
        }
        return results1;
      }).call(this));
    }
    return results;
  }

  updateTile(tile) {
    var cell, cells, i, len, results;
    cells = this.getCellsFromTile(tile);
    results = [];
    for (i = 0, len = cells.length; i < len; i++) {
      cell = cells[i];
      results.push(cell.drawTile(tile));
    }
    return results;
  }

  clearCell(x, y) {
    var cells, layer, layername, results;
    cells = this.components.map.cells;
    results = [];
    for (layername in cells) {
      layer = cells[layername];
      results.push(layer[y][x].clear());
    }
    return results;
  }

  clearCanvases() {
    var layer, layername, ref, results;
    ref = this.components.map.layers;
    results = [];
    for (layername in ref) {
      layer = ref[layername];
      results.push(layer.clearRect(0, 0, config.view.map.width * this.components.map.currentCellLength, config.view.map.height * this.components.map.currentCellLength));
    }
    return results;
  }

  drawGhostConstruction(tile, character) {
    return this.getCellFromTile(tile, 'graphics').drawGhostConstruction(character);
  }

  eraseGhostConstruction(tile) {
    return this.getCellFromTile(tile, 'graphics').clear();
  }

  getTileFromPixels(x, y) {
    var cellX, cellY;
    cellX = Math.floor(x / this.components.map.currentCellLength);
    cellY = Math.floor(y / this.components.map.currentCellLength);
    return this.getTileFromCellCoordinates(cellX, cellY);
  }

  getTileFromCell(cell) {
    return this.getTileFromCellCoordinates(cell.x, cell.y);
  }

  getCellsFromTile(tile) {
    var cells, layer, layername, ref, x, y;
    x = (app.map.width + tile.x - this.components.map.currentX) % app.map.width;
    y = (app.map.height + tile.y - this.components.map.currentY) % app.map.height;
    cells = [];
    ref = this.components.map.cells;
    for (layername in ref) {
      layer = ref[layername];
      cells.push(layer[y][x]);
    }
    return cells;
  }

  getCellFromTile(tile, layer) {
    var layerIndex;
    layerIndex = config.view.map.layers.indexOf(layer);
    if (layerIndex === -1) {
      throw new Error(layer + ' is not a valid layer');
    }
    return this.getCellsFromTile(tile)[layerIndex];
  }

  getTileFromCellCoordinates(x, y) {
    return app.map.getTile((x + this.components.map.currentX) % app.map.width, (y + this.components.map.currentY) % app.map.height);
  }

  getColorFromElevation(el) {
    var green, greenHex, red, redHex;
    //Assume max elevation is 100, min is 0
    green = Math.round(el / 100 * 255);
    red = 255 - green;
    greenHex = green.toString(16);
    redHex = red.toString(16);
    if (greenHex.length === 1) {
      greenHex = '0' + greenHex;
    }
    if (redHex.length === 1) {
      redHex = '0' + redHex;
    }
    //Return hex code
    return `#${redHex}${greenHex}00`;
  }

  getPlayerColor(clientFacingPlayer) {
    return config.view.colors.players[clientFacingPlayer.team];
  }

};

//#############################

//	INITIALIZER FUNCTIONS

//#############################
View.prototype.initialize = {
  map: {
    canvases: function(v) {
      var c, context, i, layerName, len, ref;
      $('#canvas-container').css('height', config.view.map.height * config.view.map.initialCellLength);
      ref = config.view.map.layers;
      for (i = 0, len = ref.length; i < len; i++) {
        layerName = ref[i];
        c = $("<canvas>").addClass(layerName);
        c.attr('width', config.view.map.width * config.view.map.initialCellLength).attr('height', config.view.map.height * config.view.map.initialCellLength).css('width', `${config.view.map.width * config.view.map.initialCellLength}px`).css('height', `${config.view.map.height * config.view.map.initialCellLength}px`);
        context = c[0].getContext('2d');
        v.components.map.layers[layerName] = context;
        c.appendTo("#canvas-container");
      }
      return v.components.map.clickableCanvas = $('canvas.graphics')[0];
    },
    cells: function(v) {
      var i, layer, len, ref, results, x, y;
      ref = config.view.map.layers;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        layer = ref[i];
        v.components.map.cells[layer] = [];
        results.push((function() {
          var j, ref1, results1;
          results1 = [];
          for (y = j = 0, ref1 = config.view.map.height - 1; (0 <= ref1 ? j <= ref1 : j >= ref1); y = 0 <= ref1 ? ++j : --j) {
            v.components.map.cells[layer][y] = [];
            results1.push((function() {
              var k, ref2, results2;
              results2 = [];
              for (x = k = 0, ref2 = config.view.map.width - 1; (0 <= ref2 ? k <= ref2 : k >= ref2); x = 0 <= ref2 ? ++k : --k) {
                results2.push(v.components.map.cells[layer][y][x] = new Cell(x, y, v.components.map.layers[layer]));
              }
              return results2;
            })());
          }
          return results1;
        })());
      }
      return results;
    }
  },
  controlPanel: function(v) {
    var building, buildingName, i, ref, ref1, ref2, results, squadNum;
    ref = config.model.actors.buildings.producers;
    //Building Tab
    for (buildingName in ref) {
      building = ref[buildingName];
      $("<div>").addClass('btn btn-default create-building-btn').data('building', buildingName).data('character', building.character).html(building.readableName).appendTo("#construct-tab .buttons .producers");
    }
    ref1 = config.model.actors.buildings.logistics;
    for (buildingName in ref1) {
      building = ref1[buildingName];
      $("<div>").addClass('btn btn-default create-building-btn').data('building', buildingName).data('character', building.character).html(building.readableName).appendTo("#construct-tab .buttons .logistics");
    }
//Command Tab
//Add an dropdown menu for squads
    results = [];
    for (squadNum = i = 1, ref2 = config.maxSquads; (1 <= ref2 ? i <= ref2 : i >= ref2); squadNum = 1 <= ref2 ? ++i : --i) {
      results.push($("<option>").attr('value', squadNum - 1).html(squadNum).appendTo('#squad-select'));
    }
    return results;
  }
};
