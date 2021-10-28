//import Mapper from ("./assets/scripts/Mapper.js");

// Automatically imports Phaser.JS

class Scene1 extends Phaser.Scene {
  gridSize = 22;
  width = 1150;
  height = 2000;
  bg = null;
  objGrid = null;
  ghost = null;
  obj = {};
  
constructor() { super(); }

preload()
{
  this.load.image('blockBrown',"assets/sprites/brownBlock.png");
  this.load.spritesheet('ghost',"assets/sprites/ghost.png",{frameWidth:18,frameheight:18});
  this.load.image('standardBg',"assets/backgrounds/StandardBG.png");
  this.load.image('food',"assets/sprites/food.png");
  this.load.image('water',"assets/sprites/water.png");
  this.load.image('wood',"assets/sprites/wood.png");
  
}

create()
{
  var gridSize = this.gridSize;
  var o;
  
  // the camera
  var camera = this.cameras.main;
  camera.setBounds(0,0,this.width,this.height);
  camera.setZoom(2);
  camera.roundPixels = true;
  // the background
  this.bg = this.add.image(0,0,'standardBg').setOrigin(0);
  var bg = this.bg;
  
  // the grid and scroller
  this.objGrid = this.add.grid(0,0,this.width,this.height,this.gridSize,this.gridSize,0x002600,0.5,0xffffff,0.1).setOrigin(0);//.setOutlineStyle();
  var objGrid = this.objGrid;
  objGrid.setInteractive();
  this.input.setDraggable(objGrid);
  this.input.on('drag',function(pointer,gameObject,dragX,dragY){
    camera.scrollX -= dragX;
    camera.scrollY -= dragY;
  });
   
  // the selected block highlight
  this.obj["selectedBlockHighlight"] = this.add.rectangle(-999,-999,gridSize-1,gridSize-1,0xffffff,0.5);
  
  // the resource icons on the board
  var resources = ["food","water","wood"];
  var resourceColors = {
    food : 0x00ff00,
    water : 0x0000ff,
    wood : 0x773300,
  };
  var icons = {};
  var thi = this;
  resources.forEach(function (s){
    var o = thi.add.image(-999,-999,s);
    //o = thi.add.circle(0,0,3,resourceColors[s]);
    //o.displayWidth = 11;
    //o.displayHeight = 11;
    icons[s] = o;
  });
  
  // block selection - works
  var _capture = {x:0,y:0};
  this.input.on('pointerdown', function(pointer){
    pointer.x /= camera.zoomX;
    pointer.x += (config.width/4);
    pointer.y /= camera.zoomY;
    pointer.y += (config.height/4);
    pointer.x += camera.scrollX;
    pointer.y += camera.scrollY;
    _capture.x = pointer.x;
    _capture.y = pointer.y;
  });
  this.input.on('pointerup', function(pointer) {
    pointer.x /= camera.zoomX;
    pointer.x += (config.width/4);
    pointer.y /= camera.zoomY;
    pointer.y += (config.height/4);
    pointer.x += camera.scrollX;
    pointer.y += camera.scrollY;
    if (_capture.x == pointer.x && _capture.y == pointer.y) {
      var x = Math.floor(pointer.x/gridSize);
      var y = Math.floor(pointer.y/gridSize);
      var jj = 0;
      resources.forEach(function(s){
        var g = getResources(x,y);
        if (g[s] > 0) {
          var yoffset = 7 - 4.5*(Math.floor((g.count-1)/2));
          var xoffset = g.count == 1? 5 : 0;
          icons[s].x = xoffset + x * gridSize + 5 + 11*(jj % 2);
          icons[s].y = yoffset + y * gridSize + 3 + 11*Math.floor(jj / 2);
          jj++;
        }
        else {
          icons[s].x = -999;
          icons[s].y = -999;
        }
      });
      camera.pan(pointer.x,pointer.y,200);
      var o = thi.obj['selectedBlockHighlight'];
      o.x = (x+.5) * gridSize - .5;
      o.y = (y+.5) * gridSize - .5;
      o.clock = 0;
    }
  });
  
  // generation
  var sizeX = Math.floor(this.width/gridSize);
  var sizeY = Math.floor(this.height/gridSize);
  var m;
  var maps = {};
  var seeds = {};
  resources.forEach(function(s){
    maps[s] = new Array(sizeX);
    for (var x=0; x<sizeX; x++) {
      maps[s][x] = new Array(sizeY);
      for (var y=0; y<sizeY; y++) {
        maps[s][x][y] = 0;
      }
    }
    seeds[s] = new SimplexNoise();
  });
  
  var getResources = function(_xx,_yy) {
    var o = {};
    o.count = 0;
    resources.forEach(function(s){
      var m = maps[s][_xx][_yy];
      o[s] = m;
      if (m > 0) o.count++;
    });
    return o;
  }

  for (var x=0;x<sizeX;x++) {
    for (var y = 0; y < sizeY; y++) {
      m = seeds.food.noise2D(x,y);
      if (m > .3)
        maps.food[x][y] = 1;
      
      m = seeds.water.noise2D(x,y);
      if (m > .2)
        maps.water[x][y] = 1;
      
      m = seeds.wood.noise2D(x, y);
      if (m > .4)
        maps.wood[x][y] = 1;
    }
  }
  
  // the ghost
  this.obj['ghost'] = this.physics.add.image(15,-25,'ghost');
  o = this.obj.ghost;
  if (o) {
    o.mainX = 20;
    o.mainY = -35;
  }
  
  // the HUD
  
}

update(time, delta)
{
  var bg = this.bg;
  var camera = this.cameras.main;
  camera.maxX = this.width-config.width;
  camera.maxY = this.height-config.height;
  function clamp(num, min, max) { return num <= min ? min : num >= max ? max : num }
  
  bg.x = clamp(camera.scrollX,0,camera.maxX) / 2;
  bg.y = clamp(camera.scrollY,0,camera.maxY) / 2;
  
  var o;
  o = this.obj.ghost;
  if (o) {
    o.x = camera.scrollX + config.width/2 +o.mainX + 4*Math.cos(3*time/1500);
    o.y = camera.scrollY + config.height/2 + o.mainY + 4*Math.sin(5*time/1500);
  }
  
  o = this.obj.selectedBlockHighlight;
  if (o) {
    o.clock += delta * .005;
    o.fillAlpha = Math.cos(o.clock) *.5+.5;
  }
}
}

var config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade'
    },
  scene: [ Scene1 ],
  antialias: false,
};

var game = new Phaser.Game(config);