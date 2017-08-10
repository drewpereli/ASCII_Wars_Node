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
    this.currentlyConstructing = false;
  }

  Game.prototype.changeState = function(state) {
    console.log('Changing state to ' + state);
    return this.state = state;
  };

  Game.prototype.clickTile = function(tile) {
    if (this.state === 'raising elevation') {
      return app.socket.emit('raise elevation', tile);
    } else if (this.state === 'lowering elevation') {
      return app.socket.emit('lower elevation', tile);
    }
  };

  Game.prototype.next = function() {
    return app.socket.emit('next');
  };

  Game.prototype.play = function() {
    return app.socket.emit('play');
  };

  Game.prototype.pause = function() {
    return app.socket.emit('pause');
  };

  Game.prototype.clickCreateBuildingButton = function(building) {
    this.changeState('constructing');
    return this.currentlyConstructing = building;
  };

  return Game;

})();

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
        app.map.update(map);
        return app.view.updateMap();
      };
    })(this)));
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
    $(app.view.components.map.clickableCanvas).mousedown((function(_this) {
      return function(e) {
        return app.game.clickTile(_this.getTileClicked(e));
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
        var building;
        building = $(e.target).data('building');
        return app.game.clickCreateBuildingButton(building);
      };
    })(this));
  }

  Input.prototype.getTileClicked = function(event) {
    return app.view.getTileFromPixels(event.offsetX, event.offsetY);

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
        this.tiles[y].push(new Tile(x, y));
      }
    }
  }

  Map.prototype.update = function(tiles) {
    return this.tiles = tiles;
  };

  Map.prototype.getTile = function(x, y) {
    if ((0 <= x && x < this.width) && (0 <= y && y < this.height)) {
      return this.tiles[y][x];
    }
    return false;
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
    this.layer.fillRect(x + 1, y + 1, l - 2, l - 2);
    this.layer.fillStyle = config.view.colors.cellBorder;
    this.layer.strokeRect(x, y, l, l);
    return this.cleared = false;
  };

  Cell.prototype.write = function(char, color) {
    this.layer.fillStyle = color;
    this.layer.font = this.getFont;
    return this.layer.fillText(char, this.getXPixel() + this.getCellLength() / 2, this.getYPixel() + this.getCellLength() / 2);
  };

  Cell.prototype.clear = function() {
    var l, x, y;
    x = this.getXPixel();
    y = this.getYPixel();
    l = this.getCellLength();
    return this.layer.clearRect(x, y, l, l);
  };

  Cell.prototype.drawTile = function(tile) {
    var char, charColor, fillColor;
    fillColor = false;
    charColor = false;
    char = false;
    switch (this.getLayerName()) {
      case 'terrain':
        fillColor = config.view.colors.terrain[tile.terrain];
        break;
      case 'elevation':
        fillColor = app.view.getColorFromElevation(tile.elevation);
        break;
      case 'actors':
        if (tile.actor) {
          char = tile.actor.character;
          charColor = app.view.getPlayerColor(tile.actor.player);
        }
        break;
      case 'water':
        if (tile.waterDepth > 0) {
          fillColor = 'rgb(0, 0, ' + (255 - 10 * tile.waterDepth) + ')';
        }
    }
    if (fillColor) {
      this.fill(fillColor);
    }
    if (char && charColor) {
      return this.write(char, charColor);
    }
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
        layers: {},
        cells: {},
        currentCellLength: config.view.map.initialCellLength,
        clickableCanvas: {}
      },
      control: {},
      info: {},
      message: $('.message')
    };
    this.initialize.map.canvases(this);
    this.initialize.map.cells(this);
    this.initialize.controlPanel.buttons(this);
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
              if (!tile) {
                continue;
              } else {
                results2.push(cell.drawTile(tile));
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
      console.log(layer);
      results.push(layer.clearRect(0, 0, config.view.map.width * this.components.map.currentCellLength, config.view.map.height * this.components.map.currentCellLength));
    }
    return results;
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
    var color;
    color = ['red', 'blue', 'green'];
    return color[clientFacingPlayer.team - 1];
  };

  return View;

})();

View.prototype.initialize = {
  map: {
    canvases: function(v) {
      var c, i, layerName, len, ref;
      ref = config.view.map.layers;
      for (i = 0, len = ref.length; i < len; i++) {
        layerName = ref[i];
        c = $("<canvas>").addClass(layerName);
        c.attr('width', config.view.map.width * config.view.map.initialCellLength).attr('height', config.view.map.height * config.view.map.initialCellLength).css('width', (config.view.map.width * config.view.map.initialCellLength) + "px").css('height', (config.view.map.height * config.view.map.initialCellLength) + "px");
        v.components.map.layers[layerName] = c[0].getContext('2d');
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
  controlPanel: {
    buttons: function(v) {
      var building, buildingName, ref, results;
      ref = config.model.actors.buildings.producers;
      results = [];
      for (buildingName in ref) {
        building = ref[buildingName];
        results.push($("<div>").addClass('btn btn-default create-building-btn').data('building', buildingName).html(building.readableName).appendTo("#construct-tab .buttons"));
      }
      return results;
    }
  }
};
