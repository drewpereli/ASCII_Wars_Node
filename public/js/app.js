var app;

app = {
  game: null,
  map: null,
  view: null,
  input: null,
  socket: null
};



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
  return app.socket = new Socket();
};

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
    this.unit = false;
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
    this.layer.fillRect(x, y, l, l);
    return this.cleared = false;
  };

  Cell.prototype.clear = function() {
    var l, x, y;
    x = this.getXPixel();
    y = this.getYPixel();
    l = this.getCellLength();
    return this.layer.clearRect(x, y, l, l);
  };

  Cell.prototype.getCellLength = function() {
    return app.view.components.map.currentCellLength;
  };

  Cell.prototype.getXPixel = function() {
    return this.getCellLength() * this.x;
  };

  Cell.prototype.getYPixel = function() {
    return this.getCellLength() * this.y;
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
        currentCellLength: config.view.map.initialCellLength
      },
      control: {},
      info: {},
      message: $('.message')
    };
    this.initialize.map.canvases(this);
    this.initialize.map.cells(this);
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
    var cell, cells, color, layer, layername, results, row, tile, x, y;
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
                color = this.getColorFromElevation(tile.elevation);
              } else {
                color = 'black';
              }
              results2.push(cell.fill(color));
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

  View.prototype.getTileFromCell = function(cell) {
    return app.map.getTile(cell.x + this.components.map.currentX, cell.y + this.components.map.currentY);
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

  return View;

})();

View.prototype.initialize = {
  map: {
    canvases: function(v) {
      var c, i, layerName, len, ref, results;
      ref = config.view.map.layers;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        layerName = ref[i];
        c = $("<canvas>").addClass(layerName);
        c.attr('width', config.view.map.width * config.view.map.initialCellLength).attr('height', config.view.map.height * config.view.map.initialCellLength).css('width', (config.view.map.width * config.view.map.initialCellLength) + "px").css('height', (config.view.map.height * config.view.map.initialCellLength) + "px");
        v.components.map.layers[layerName] = c[0].getContext('2d');
        results.push(c.appendTo("#canvas-container"));
      }
      return results;
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
  }
};
