//import Mapper from ("./assets/scripts/Mapper.js");

// Automatically imports Phaser.JS

class Scene1 extends Phaser.Scene {
  gridSize = 22;
  width = 1150;
  height = 2000;
  bg = null;
  grid = null;
  ghost = null;
  obj = {};
  hud = {};
  resources = ["food","water","wood"];
  fetch = {
    resources: function(){},
  }
  instantiate = {
    selectedBlockHighlight: function (thi,o){
      o.is="selectedBlockHighlight";
      o.step = function(its,time,delta) {
        its.clock += delta * .005;
        its.fillAlpha = Math.cos(its.clock) *.5+.5;
      }
    },
    ghost: function (thi,o) {
      o.is="ghost";
      o.mainX = 20;
      o.mainY = -35;
      o.step = function(o,time,delta,a1,a2){
        o.x = a1 + o.mainX + 4*Math.cos(3*time/1500);
        o.y = a2 + o.mainY + 4*Math.sin(5*time/1500);
      }
    },
    male: function(thi,o) {
      o.is="male";
      o.setOrigin(0,0);
      o.foodHp = 10;
      o.shelterHp = 10;
      o.moving = {status: false, x:0,y:0};
      o.carrying = {}; thi.resources.forEach(function(s){o.carrying[s]=0;});
      o.setLocation = function(x,y) {
        o.location = { x:Math.floor(x/thi.gridSize),y:Math.floor(y/thi.gridSize)};
      };
      o.getLocation = function() {
        return { x: 22*Math.round(o.x/22), y: 22*Math.round(o.y/22)}
      };
      o.moveTo = function (x,y) {
        o.moving.status = true;
        o.moving.x = x;
        o.moving.y = y;
      }
      o.step = function(o,time,delta) {
        if (o.moving.status) {
          if (o.moving.x > o.location.x)
          // move one direction, one block at a time
        }
      }
    }
  }
  economy = {
    demand: function(supplyKid, supplyFood) {
      return (1-(supplyKid/supplyFood))
    },
    chooseBuy: function(money,goods) {
      var totalWeight = 0;

      for (var w in goods) {
          totalWeight += 1/w.count;
      }

      var random = Math.floor(Math.random() * totalWeight);

      for (var i = 0; i < goods.length; i++) {
        random -= 1/goods[i].count;

        if (random < 0) {
            return goods.resource;
        }
      }
    }
  }
  
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
  var thi = this;
  
  // the camera
  var camera = this.cameras.main;
  camera.setBounds(0,0,this.width,this.height);
  camera.setZoom(2);
  camera.roundPixels = true;
  
  // the background
  this.bg = this.add.image(0,0,'standardBg').setOrigin(0);
  var bg = this.bg;
  
  // the grid
  o = this.add.grid(0,0,this.width,this.height,this.gridSize,this.gridSize,0x002600,0.5,0xffffff,0.1).setOrigin(0);//.setOutlineStyle();
  o.setInteractive();
  this.grid = o;
  
  // the scroller
  this.input.setDraggable(this.grid);
  this.input.on('drag',function(pointer,gameObject,dragX,dragY){
    //if (pointer.y > config.height -200) return;
    camera.scrollX -= dragX; camera.scrollY -= dragY;
  });
   
  // the selected block highlight
  o = this.add.rectangle(-999,-999,gridSize-1,gridSize-1,0xffffff,0.5);
  this.instantiate.selectedBlockHighlight(this,o);
  this.obj.selectedBlockHighlight = o;
  
  // the resource icons on the board
  var resources = this.resources;
  var resourceColors = {
    food : 0x00ff00,
    water : 0x0000ff,
    wood : 0x773300,
  };
  var icons = {};
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
    //if (pointer.y > config.height -200) return;
    pointer.x /= camera.zoomX;
    pointer.x += (config.width/4);
    pointer.y /= camera.zoomY;
    pointer.y += /*-50*/ + (config.height/4);
    pointer.x += camera.scrollX;
    pointer.y += camera.scrollY;
    _capture.x = pointer.x;
    _capture.y = pointer.y;
  });
  this.input.on('pointerup', function(pointer) {
    //if (pointer.y > config.height -200) return;
    pointer.x /= camera.zoomX;
    pointer.x += (config.width/4);
    pointer.y /= camera.zoomY;
    pointer.y += /*-50*/+(config.height/4);
    pointer.x += camera.scrollX;
    pointer.y += camera.scrollY;
    if (_capture.x == pointer.x && _capture.y == pointer.y) {
      var x = Math.floor(pointer.x/gridSize);
      var y = Math.floor(pointer.y/gridSize);
      var jj = 0;
      resources.forEach(function(s){
        var g = thi.fetch.resources(x,y);
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
      
      o = thi.obj.selectedBlockHighlight;
      if (o) {
        o.x = (x+.5) * gridSize - .5;
        o.y = (y+.5) * gridSize - .5;
        o.clock = 0;
      }
      
      thi.hud.textStatus.setText("Tile");
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
  
  // gets the resources at a block
  this.fetch.resources = function(_xx,_yy) {
    var o = {};
    o.count = 0;
    resources.forEach(function(s){
      var m = maps[s][_xx][_yy];
      o[s] = m;
      if (m > 0) o.count++;
    });
    return o;
  }

  // state the resources at a block
  for (var x=0;x<sizeX;x++) {
    for (var y = 0; y < sizeY; y++) {
      m = seeds.food.noise2D(x,y);
      if (m > .3) maps.food[x][y] = 1;
      m = seeds.water.noise2D(x,y);
      if (m > .2) maps.water[x][y] = 1;
      m = seeds.wood.noise2D(x,y);
      if (m > .4) maps.wood[x][y] = 1;
    }
  }
  
  // the human
  this.obj.males = [];
  this.obj.females = [];
  
  o = this.add.rectangle(6,6,9,9,0xffffff);
  this.instantiate.male(this,o);
  this.obj.males[0] = o;
  
  // the ghost
  o = this.physics.add.image(15,-25,'ghost');
  this.instantiate.ghost(this,o);
  this.obj.ghost = o;
  
  // the HUD camera
  /*
  var hudx = -10000;
  var hudy = -10000;
  camera.height -= 200;
  var cam2 = this.cameras.add();
  cam2.width = config.width;
  cam2.height = 200;
  cam2.x = 0;
  cam2.y = config.height - 200;
  cam2.scrollX = hudx;
  cam2.scrollY = hudy;
  this.camera2 = cam2;
  
  // the background
  this.hud.bg = this.add.rectangle(hudx,hudy,config.width*2,400,0xffffff);
  
  // the status header
  this.hud.textStatus = this.add.text(hudx+10,hudy+10)
    .setText('Click to move')
    .setStyle({fontSize: '25px',fontFamily: 'Courier',color: '#000000'});
  
  // the task text
  this.hud.textTask = this.add.text(hudx+10/*config.width*.5"/,hudy+50)
    .setText('Welcome to this text.')
    .setStyle({fontSize: '18px',fontFamily: 'Arial',fontWeight: 'bold',color: '#000000',align: 'center'})
    .setWordWrapWidth(config.width-10);
  
  // the HUD has several viewing modes.
  // task tile
  this.hud.mode = "task";
  
  */
}

update(time, delta)
{
  var bg = this.bg;
  var camera = this.cameras.main;
  camera.maxX = this.width-config.width;
  camera.maxY = this.height-config.height;
  function clamp(num, min, max) { return num <= min ? min : num >= max ? max : num }
  var camX = clamp(camera.scrollX,-config.width/4,camera.maxX+config.width/4);
  var camY = clamp(camera.scrollY,-config.height/4,camera.maxY+config.height/4);
  var camCenterX = camX + config.width/2;
  var camCenterY = camY + config.height/2// - 50;
  
  bg.x = camX / 2;
  bg.y = camY / 2;
  
  for (var o in this.obj) {
    //console.log(o);
    var obj = this.obj[o];
    if (obj) {
      if (Array.isArray(obj))
        obj.forEach(function(j){j.step(j,time,delta)});
      else {
             if (obj.is==="ghost") obj.step(obj,time,delta,camCenterX,camCenterY);
        else obj.step(obj,time,delta);
      }
    }
  }
  
}
}

var config = { type: Phaser.AUTO, width: window.innerWidth, height: window.innerHeight, physics: { default: 'arcade' }, scene: [ Scene1 ], antialias: false, };
var game = new Phaser.Game(config);