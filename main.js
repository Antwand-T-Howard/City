//import Mapper from ("./assets/scripts/Mapper.js");

// Automatically imports Phaser.JS

class Scene1 extends Phaser.Scene {
  gridSize = 22;
  width = 1150;
  height = 2000;
  bg = null;
  objGrid = null;
  ghost = null;
  
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
  // the camera
  var camera = this.cameras.main;
  camera.setBounds(0,0,this.width,this.height);
  camera.setZoom(2);
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
    var o = thi.add.image(10,10,s);
    //o = thi.add.circle(0,0,3,resourceColors[s]);
    o.displayWidth = 8;
    o.displayHeight = 8;
    icons[s] = o;
  });
  
  // block selection
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
        if (getResources(x,y)[s] > 0) {
          icons[s].x = x * gridSize + 2 + 7*(jj % 3);
          icons[s].y = y * gridSize + 2 + 7*Math.floor(jj / 3);
        
          jj++;
        }
        else {
          icons[s].x = -999;
          icons[s].y = -999;
        }
      });
      camera.pan(pointer.x,pointer.y,200);
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
    for (var x=0; x<sizeX; x++)
      maps[s][x] = new Array(sizeY);
    seeds[s] = new SimplexNoise();
  });
  
  var getResources = function(_xx,_yy) {
    var o = {};
    resources.forEach(function(s){
      o[s] = maps[s][_xx][_yy];
    });
    return o;
  }

  for (var x=0;x<sizeX;x++) {
    for (var y = 0; y < sizeY; y++) {
      m = seeds.food.noise2D(x,y);
      if (m > .3) {
        maps.food[x][y] = 1;
        }
      else
        maps.food[x][y] = 0;
      
      m = seeds.water.noise2D(x,y);
      if (m > .2) {
        maps.water[x][y] = 1;
      }
      else
        maps.water[x][y] = 0;
      
      m = seeds.wood.noise2D(x, y);
      if (m > .4) {
        maps.wood[x][y] = 1;
      }
      else
        maps.wood[x][y] = 0;
    }
  }
  
  this.ghost = this.physics.add.image(15,-25,'ghost');
  this.ghost.mainX = 10;
  this.ghost.mainY = -25;
  
}

update(time, delta)
{
  var bg = this.bg;
  var camera = this.cameras.main;
  camera.maxX = this.width-config.width;
  camera.maxY = this.height-config.height;
  function clamp(num, min, max) { return num <= min ? min : num >= max ? max : num }
  
  bg.x = clamp(camera.scrollX,0,camera.maxX) / 4;
  bg.y = clamp(camera.scrollY,0,camera.maxY) / 4;
  
  var ghost = this.ghost;
  if (ghost) {
    ghost.x = camera.scrollX + config.width/2 +ghost.mainX + 4*Math.cos(3*time/1500);
    ghost.y = camera.scrollY + config.height/2 + ghost.mainY + 4*Math.sin(5*time/1500);
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
  scene: [ Scene1 ]
};

var game = new Phaser.Game(config);