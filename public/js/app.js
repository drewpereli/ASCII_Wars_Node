var app;

app = {
  game: null,
  map: null,
  view: null,
  input: null,
  socket: null
};

var Game;

Game = (function() {
  function Game() {
    this.state;
    this.timeState = 'paused';
    this.currentlyConstructing = false;
    this.currentlyConstructingChar = false;
    this.selectedTile = null;
    this.hoveredTile = null;
  }

  Game.prototype.changeState = function(state) {
    console.log('Changing state to ' + state);
    return this.state = state;
  };

  Game.prototype.changeTimeState = function(state) {
    if (state === this.timeState) {
      return;
    }
    this.timeState = state;
    if (this.timeState === 'playing') {
      return app.socket.emit('next');
    }
  };

  Game.prototype.moveMap = function(dirIndex) {
    return app.view.moveMap(dirIndex);
  };

  Game.prototype.zoom = function(direction) {
    return app.view.zoom(direction);
  };

  Game.prototype.clickTile = function(tile) {
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
  };

  Game.prototype.rightClickTile = function(tile) {
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
  };

  Game.prototype.hoverTile = function(tile) {
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
  };

  Game.prototype.mouseLeaveCanvas = function() {
    app.view.eraseGhostConstruction(this.hoveredTile);
    return this.hoveredTile = null;
  };

  Game.prototype.clickDiggingCheckbox = function(checked) {
    var selectedSquad;
    selectedSquad = $('#squad-select').val();
    return app.socket.emit('update behavior params', {
      squad: selectedSquad,
      digging: checked
    });
  };

  Game.prototype.changeDiggingDirection = function(dir) {
    var selectedSquad;
    selectedSquad = $('#squad-select').val();
    return app.socket.emit('update behavior params', {
      squad: selectedSquad,
      diggingDirection: dir
    });
  };

  Game.prototype.changeSquadAlignment = function(alignment) {
    var selectedSquad;
    if (alignment === 'none') {
      alignment = false;
    }
    selectedSquad = $('#squad-select').val();
    return app.socket.emit('update behavior params', {
      squad: selectedSquad,
      alignment: alignment
    });
  };

  Game.prototype.controlClickTile = function(tile) {};

  Game.prototype.next = function() {
    return app.socket.emit('next');
  };

  Game.prototype.play = function() {
    return this.changeTimeState('playing');
  };

  Game.prototype.pause = function() {
    return this.changeTimeState('paused');
  };

  Game.prototype.clickCreateBuildingButton = function(building, character) {
    this.changeState('constructing');
    this.currentlyConstructing = building;
    return this.currentlyConstructingChar = character;
  };

  Game.prototype.updateMap = function(map) {
    app.map.update(map);
    app.view.updateMap();
    if (this.timeState === 'playing') {
      return app.socket.emit('next');
    }
  };

  Game.prototype.updateTile = function(tile) {
    app.map.updateTile(tile.x, tile.y, tile);
    return app.view.updateTile(tile);
  };

  return Game;

})();

$(function() {
  $('ul.menu > li').first().addClass('selected');
  return $('ul.menu').each((function(_this) {
    return function(index, menu) {
      return $('body').keydown(function(e) {
        var dir, functionName, newlySelectedIndex, numItems, selectedItem, selectedItemIndex;
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
    };
  })(this));
});

var Socket;

Socket = (function() {
  function Socket() {
    this.io = io();
    this.io.on('message', (function(_this) {
      return function(message) {
        return app.view.displayMessage(message);
      };
    })(this));
    this.io.on('map updated', ((function(_this) {
      return function(map) {
        map = JSON.parse(map);
        return app.game.updateMap(map);
      };
    })(this)));
    this.io.on('tile updated', ((function(_this) {
      return function(tile) {
        tile = JSON.parse(tile);
        return app.game.updateTile(tile);
      };
    })(this)));
    this.io.on('player added', (function(_this) {
      return function(numPlayers) {
        return app.view.addPlayer(numPlayers);
      };
    })(this));
    this.io.on('game start', (function(_this) {
      return function() {
        return app.view.startGame();
      };
    })(this));
    return this.io;
  }

  return Socket;

})();

var hexToRGBA, hexToRGBAComponents;

hexToRGBA = function(hex, opacity) {
  var c;
  if (opacity == null) {
    opacity = 1;
  }
  c = hexToRGBAComponents(hex, opacity);
  return "rgba(" + (c.join(',')) + ")";
};

hexToRGBAComponents = function(hex, opacity) {
  var num;
  if (opacity == null) {
    opacity = 1;
  }
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

Input = (function() {
  function Input() {
    this.usedKeys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', '-', '='];
    $('body').keydown((function(_this) {
      return function(e) {
        return _this.processKeyDown(e);
      };
    })(this));
    $(app.view.components.map.clickableCanvas).mousedown((function(_this) {
      return function(e) {
        e.preventDefault();
        switch (e.which) {
          case 1:
            return app.game.clickTile(_this.getTileFromEvent(e));
          case 3:
            return app.game.rightClickTile(_this.getTileFromEvent(e));
        }
      };
    })(this));
    $(app.view.components.map.clickableCanvas).mousemove((function(_this) {
      return function(e) {
        return app.game.hoverTile(_this.getTileFromEvent(e));
      };
    })(this));
    $(app.view.components.map.clickableCanvas).mouseleave((function(_this) {
      return function(e) {
        return app.game.mouseLeaveCanvas();
      };
    })(this));
    $('#digging-checkbox').change((function(_this) {
      return function() {
        return app.game.clickDiggingCheckbox($('#digging-checkbox').is(':checked'));
      };
    })(this));
    $('#digging-direction-select').change((function(_this) {
      return function() {
        return app.game.changeDiggingDirection($('#digging-direction-select').val());
      };
    })(this));
    $('.alignment-selection').change((function(_this) {
      return function() {
        return app.game.changeSquadAlignment($('.alignment-selection:checked').val());
      };
    })(this));
    $(app.view.components.map.clickableCanvas).contextmenu((function(_this) {
      return function() {
        return false;
      };
    })(this));
    $("#next-btn").click((function(_this) {
      return function() {
        return app.game.next();
      };
    })(this));
    $("#play-btn").click((function(_this) {
      return function() {
        return app.game.play();
      };
    })(this));
    $("#pause-btn").click((function(_this) {
      return function() {
        return app.game.pause();
      };
    })(this));
    $('.create-building-btn').click((function(_this) {
      return function(e) {
        var building, character;
        building = $(e.target).data('building');
        character = $(e.target).data('character');
        return app.game.clickCreateBuildingButton(building, character);
      };
    })(this));
  }

  Input.prototype.getTileFromEvent = function(event) {
    var cellX, cellY, x, y;
    cellX = Math.floor(event.offsetX / app.view.components.map.currentCellLength);
    cellY = Math.floor(event.offsetY / app.view.components.map.currentCellLength);
    x = (cellX + app.view.components.map.currentX) % app.map.width;
    y = (cellY + app.view.components.map.currentY) % app.map.height;
    return {
      x: x,
      y: y
    };

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
  };

  Input.prototype.processKeyDown = function(event) {
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
  };

  return Input;

})();

var Map;

Map = (function() {
  function Map() {
    var i, j, ref, ref1, x, y;
    this.height = config.model.map.height;
    this.width = config.model.map.width;
    this.tiles = [];
    for (y = i = 0, ref = this.height; 0 <= ref ? i <= ref : i >= ref; y = 0 <= ref ? ++i : --i) {
      this.tiles.push([]);
      for (x = j = 0, ref1 = this.width; 0 <= ref1 ? j <= ref1 : j >= ref1; x = 0 <= ref1 ? ++j : --j) {
        this.tiles[y].push(false);
      }
    }
  }

  Map.prototype.update = function(mapInfo) {
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
  };

  Map.prototype.getTile = function(x, y) {
    if ((0 <= x && x < this.width) && (0 <= y && y < this.height)) {
      return this.tiles[y][x];
    }
    return false;
  };

  Map.prototype.updateTile = function(x, y, tileParams) {
    if (!this.getTile(x, y)) {
      return false;
    }
    return Object.assign(this.tiles[y][x], tileParams);
  };

  return Map;

})();

var Tile;

Tile = (function() {
  function Tile(x, y) {
    this.x = x;
    this.y = y;
    this.terrain = 'water';
    this.elevation = 0;
    this.actor = false;
  }

  return Tile;

})();

var Cell;

Cell = (function() {
  function Cell(x1, y1, layer) {
    this.x = x1;
    this.y = y1;
    this.layer = layer;
    this.cleared = true;
    this.layer.textBaseline = 'middle';
    this.layer.textAlign = 'center';
  }

  Cell.prototype.fill = function(color, opacity) {
    var l, x, y;
    if (opacity == null) {
      opacity = 1;
    }
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
  };

  Cell.prototype.write = function(char, color) {
    var l, x, y;
    l = this.getCellLength();
    x = this.getXPixel();
    y = this.getYPixel();
    this.layer.fillStyle = color;
    return this.layer.fillText(char, this.getXPixel() + this.getCellLength() / 2, this.getYPixel() + this.getCellLength() / 2);
  };

  Cell.prototype.stroke = function(color) {
    var l, x, y;
    x = this.getXPixel();
    y = this.getYPixel();
    l = this.getCellLength();
    this.layer.fillStyle = color;
    return this.layer.strokeRect(x + 1, y + 1, l - 2, l - 2);
  };

  Cell.prototype.clear = function() {
    var l, x, y;
    x = this.getXPixel();
    y = this.getYPixel();
    l = this.getCellLength();
    return this.layer.clearRect(x - 0, y - 0, l + 0, l + 0);
  };

  Cell.prototype.drawTile = function(tile) {
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
  };

  Cell.prototype.drawGhostConstruction = function(character) {
    var color;
    this.clear();
    color = 'rgba(0,0,0,.5)';
    this.write(character, color);
    return this.stroke(color);
  };

  Cell.prototype.getCellLength = function() {
    return app.view.components.map.currentCellLength;
  };

  Cell.prototype.getFont = function() {
    return this.getCellLength() + 'px monospace';
  };

  Cell.prototype.getXPixel = function() {
    return this.getCellLength() * this.x;
  };

  Cell.prototype.getYPixel = function() {
    return this.getCellLength() * this.y;
  };

  Cell.prototype.getLayerName = function() {
    var mapLayers;
    mapLayers = app.view.components.map.layers;
    return Object.keys(mapLayers).find((function(_this) {
      return function(name) {
        return mapLayers[name] === _this.layer;
      };
    })(this));
  };

  return Cell;

})();

var View;

View = (function() {
  function View() {
    this.components = {
      map: {
        currentX: 0,
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

  View.prototype.displayMessage = function(message) {
    var m;
    m = this.components.message;
    if (m.hasClass('has-message')) {
      m.stop(true).css('opacity', 1);
    }
    return m.html(message).addClass('has-message').animate({
      opacity: 1
    }, config.view.messageFadeDelay * 1000).fadeOut({
      complete: (function(_this) {
        return function() {
          return m.empty().show().removeClass('has-message');
        };
      })(this)
    });
  };

  View.prototype.addPlayer = function(numPlayers) {
    this.displayMessage('Player ' + numPlayers + ' added');
    return $('#playerCount').html(numPlayers);
  };

  View.prototype.startGame = function() {
    $('#preGameScreen').addClass('hidden');
    return $('#gameScreen').removeClass('hidden');
  };

  View.prototype.moveMap = function(dirIndex) {
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
  };

  View.prototype.updateMap = function() {
    var cell, cells, layer, layername, results, row, tile, x, y;
    this.clearCanvases();
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
  };

  View.prototype.updateTile = function(tile) {
    var cell, cells, i, len, results;
    cells = this.getCellsFromTile(tile);
    results = [];
    for (i = 0, len = cells.length; i < len; i++) {
      cell = cells[i];
      results.push(cell.drawTile(tile));
    }
    return results;
  };

  View.prototype.clearCell = function(x, y) {
    var cells, layer, layername, results;
    cells = this.components.map.cells;
    results = [];
    for (layername in cells) {
      layer = cells[layername];
      results.push(layer[y][x].clear());
    }
    return results;
  };

  View.prototype.clearCanvases = function() {
    var layer, layername, ref, results;
    ref = this.components.map.layers;
    results = [];
    for (layername in ref) {
      layer = ref[layername];
      results.push(layer.clearRect(0, 0, config.view.map.width * this.components.map.currentCellLength, config.view.map.height * this.components.map.currentCellLength));
    }
    return results;
  };

  View.prototype.drawGhostConstruction = function(tile, character) {
    return this.getCellFromTile(tile, 'graphics').drawGhostConstruction(character);
  };

  View.prototype.eraseGhostConstruction = function(tile) {
    return this.getCellFromTile(tile, 'graphics').clear();
  };

  View.prototype.getTileFromPixels = function(x, y) {
    var cellX, cellY;
    cellX = Math.floor(x / this.components.map.currentCellLength);
    cellY = Math.floor(y / this.components.map.currentCellLength);
    return this.getTileFromCellCoordinates(cellX, cellY);
  };

  View.prototype.getTileFromCell = function(cell) {
    return this.getTileFromCellCoordinates(cell.x, cell.y);
  };

  View.prototype.getCellsFromTile = function(tile) {
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
  };

  View.prototype.getCellFromTile = function(tile, layer) {
    var layerIndex;
    layerIndex = config.view.map.layers.indexOf(layer);
    if (layerIndex === -1) {
      throw new Error(layer + ' is not a valid layer');
    }
    return this.getCellsFromTile(tile)[layerIndex];
  };

  View.prototype.getTileFromCellCoordinates = function(x, y) {
    return app.map.getTile((x + this.components.map.currentX) % app.map.width, (y + this.components.map.currentY) % app.map.height);
  };

  View.prototype.getColorFromElevation = function(el) {
    var green, greenHex, red, redHex;
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
    return "#" + redHex + greenHex + "00";
  };

  View.prototype.getPlayerColor = function(clientFacingPlayer) {
    return config.view.colors.players[clientFacingPlayer.team];
  };

  return View;

})();

View.prototype.initialize = {
  map: {
    canvases: function(v) {
      var c, context, i, layerName, len, ref;
      $('#canvas-container').css('height', config.view.map.height * config.view.map.initialCellLength);
      ref = config.view.map.layers;
      for (i = 0, len = ref.length; i < len; i++) {
        layerName = ref[i];
        c = $("<canvas>").addClass(layerName);
        c.attr('width', config.view.map.width * config.view.map.initialCellLength).attr('height', config.view.map.height * config.view.map.initialCellLength).css('width', (config.view.map.width * config.view.map.initialCellLength) + "px").css('height', (config.view.map.height * config.view.map.initialCellLength) + "px");
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
          for (y = j = 0, ref1 = config.view.map.height - 1; 0 <= ref1 ? j <= ref1 : j >= ref1; y = 0 <= ref1 ? ++j : --j) {
            v.components.map.cells[layer][y] = [];
            results1.push((function() {
              var k, ref2, results2;
              results2 = [];
              for (x = k = 0, ref2 = config.view.map.width - 1; 0 <= ref2 ? k <= ref2 : k >= ref2; x = 0 <= ref2 ? ++k : --k) {
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
    for (buildingName in ref) {
      building = ref[buildingName];
      $("<div>").addClass('btn btn-default create-building-btn').data('building', buildingName).data('character', building.character).html(building.readableName).appendTo("#construct-tab .buttons .producers");
    }
    ref1 = config.model.actors.buildings.logistics;
    for (buildingName in ref1) {
      building = ref1[buildingName];
      $("<div>").addClass('btn btn-default create-building-btn').data('building', buildingName).data('character', building.character).html(building.readableName).appendTo("#construct-tab .buttons .logistics");
    }
    results = [];
    for (squadNum = i = 1, ref2 = config.maxSquads; 1 <= ref2 ? i <= ref2 : i >= ref2; squadNum = 1 <= ref2 ? ++i : --i) {
      results.push($("<option>").attr('value', squadNum - 1).html(squadNum).appendTo('#squad-select'));
    }
    return results;
  }
};
