//import Mapper from ("./assets/scripts/Mapper.js");

// Automatically imports Phaser.JS

class Scene1 extends Phaser.Scene {
  gridSize = 22;
  width = 1150;
  height = 2000;
  sizeX = Math.floor(this.width/this.gridSize);
  sizeY = Math.floor(this.height/this.gridSize);
  bg = null;
  grid = null;
  obj = {};
  hud = {};
  maps = {};
  seeds = {};
  dir = {UP:90,DOWN:270,LEFT:180,RIGHT:0,UPRIGHT:45,UPLEFT:135,DOWNRIGHT:315,DOWNLEFT:225}
  resources = ["food","water","wood"];
  resourceColors = {
    food : 0x00ff00,
    water : 0x0000ff,
    wood : 0x773300,
  };
  fetch = {
    // Gets count of all resources at x,y
    resources: function(thi,x,y) { var o = {}; o.count = 0; x = Math.round(util.clamp(x,0,thi.sizeX-1)); y = Math.round(util.clamp(y,0,thi.sizeY-1)); thi.resources.forEach(function(s) { var m = thi.maps[s][x][y]; o[s] = m; if (m > 0) o.count++; }); return o; },
    // Finds nearest block within max radius with a set minimum number of 'resource'.
    nearest: function(thi,resource,yourLocation,direction,maxdist,minResources=0) { if (!yourLocation) return null; var xx = yourLocation.x + Math.cos(Math.PI*direction/180); var yy = yourLocation.y - Math.sin(Math.PI*direction/180); var d = thi.sizeX * thi.sizeY; var res = null; for (var i = xx - maxdist; i < xx + maxdist; i++) { for (var j = yy - maxdist; j < yy + maxdist; j++) { i = Math.round(i); j = Math.round(j); var g = thi.fetch.resources(thi,i,j); if (g[resource]>=minResources) { var dist = Math.sqrt(Math.pow(i-xx,2)+Math.pow(j-yy,2)); if (dist < d) { res = { x: i, y: j, dist: dist, count: g[resource]}; d = dist; } } } } return res; }
  }
  instantiate = {
    resources: function(thi){
      var m;
      thi.resources.forEach(function(s){
        thi.maps[s] = new Array(thi.sizeX);
        for (var x=0; x<thi.sizeX; x++) {
          thi.maps[s][x] = new Array(thi.sizeY);
          for (var y=0; y<thi.sizeY; y++) {
            thi.maps[s][x][y] = 0;
          }
        }
        thi.seeds[s] = new SimplexNoise();
      });
      for (var y=0;y<thi.sizeY;y++) {
        for (var x=0;x<thi.sizeX;x++) {
          m = thi.seeds.food.noise2D(x,y);
          if (m > .3) thi.maps.food[x][y] = 1;
          m = thi.seeds.water.noise2D(x,y);
          if (m > .2) thi.maps.water[x][y] = 1;
          m = thi.seeds.wood.noise2D(x,y);
          if (m > .4) thi.maps.wood[x][y] = 1;
        }
      }
      thi.obj.males = [];
      thi.obj.females = [];
    },
    selectedBlockHighlight: function (thi,o){
      o.is="selectedBlockHighlight";
      o.step = function(its,time,delta) {
        its.clock += delta*.005;
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
      o.sp=2;
      o.foodHp = 10;
      o.shelterHp = 10;
      o.movingTo = {status: false, x:0, y:0, direction: 0, timer: 0, interval: 1};
      o.carrying = {}; thi.resources.forEach(function(s){o.carrying[s]=0;});
      o.lastLoc = 0;
      o.setLocation = function(o,x,y) {
        o.location = { x:Math.floor(x/22),y:Math.floor(y/22)};
      };
      o.getLocation = function(o) {
        return { x: Math.round(o.x/22), y: Math.round(o.y/22)}
      };
      o.moveTo = function (o,location) {
        if (!location) {console.log("NULL MOVETO LOCATION"); return;}
        o.movingTo.status = true;
        o.movingTo.x = location.x;
        o.movingTo.y = location.y;
        o.movingTo.direction = 0;
        o.movingTo.interval = 1000/o.sp;
        o.movingTo.timer = o.movingTo.interval;
      }
      o.step = function(o,time,delta) {
        if (o.movingTo.status) {
          o.movingTo.timer -= delta;
          if (o.movingTo.timer <= 0) {
            var location = o.getLocation(o);
            var xx = location.x;
            var yy = location.y;
            if (o.movingTo.y < yy) { o.movingTo.direction = 270; }
            else if (o.movingTo.x > xx) { o.movingTo.direction = 0; }
            else if (o.movingTo.y > yy) { o.movingTo.direction = 90; }
            else if (o.movingTo.x < xx) { o.movingTo.direction = 180; }
            else {o.movingTo.status = false;}
            o.movingTo.timer = o.movingTo.interval;
            //console.log(o.moveTo)
            if (o.movingTo.status) {
              o.x += Math.cos(o.movingTo.direction*Math.PI/180) * 22;
              o.y += Math.sin(o.movingTo.direction*Math.PI/180) * 22;
              //console.log(xx,yy,o.movingTo)
            }
          }
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
  this.load.image('male',"assets/sprites/male.png");
  this.load.image('female',"assets/sprites/female.png");
  this.load.spritesheet('money',"assets/sprites/money.png",{frameWidth:22,frameheight:22});
  
}

create()
{
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
  o = this.add.rectangle(-999,-999,this.gridSize-1,this.gridSize-1,0xffffff,0.5);
  this.instantiate.selectedBlockHighlight(this,o);
  this.obj.selectedBlockHighlight = o;
  
  // the resource icons on the board
  var resources = this.resources;
  var resourceColors = this.resourceColors;
  var icons = {};
  this.resources.forEach(function (s){
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
      var x = Math.floor(pointer.x/thi.gridSize);
      var y = Math.floor(pointer.y/thi.gridSize);
      var jj = 0;
      resources.forEach(function(s){
        var g = thi.fetch.resources(thi,x,y);
        if (g[s] > 0) {
          var yoffset = 7 - 4.5*(Math.floor((g.count-1)/2));
          var xoffset = g.count == 1? 5 : 0;
          icons[s].x = xoffset + x * thi.gridSize + 5 + 11*(jj % 2);
          icons[s].y = yoffset + y * thi.gridSize + 3 + 11*Math.floor(jj / 2);
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
        o.x = (x+.5) * thi.gridSize - .5;
        o.y = (y+.5) * thi.gridSize - .5;
        o.clock = 0;
      }
      
      o = thi.obj.males[0];
      if (o) {
        var n = thi.fetch.nearest(thi,'wood',{x:x,y:y},o.movingTo.direction,8,1);
        o.moveTo(o,n);
        console.log(n);
      }
      
      //thi.hud.textStatus.setText("Tile");
    }
  });
  
  // generation
  this.instantiate.resources(this);
  
  // the human
  o = this.physics.add.sprite(220,220,'male');
  this.instantiate.male(this,o);
  o.setOrigin(0);
  this.obj.males[0] = o;
  
  // the ghost
  o = this.physics.add.image(15,-25,'ghost');
  this.instantiate.ghost(this,o);
  this.obj.ghost = o;
  
  o = this.add.sprite(220,220,'money');
  this.anims.create({key:"moneyspin",frames:"money",frameRate:2,repeat:-1});
  o.setOrigin(0,0.75);
  o.play("moneyspin");
  
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
  var camX = util.clamp(camera.scrollX,-config.width/4,camera.maxX+config.width/4);
  var camY = util.clamp(camera.scrollY,-config.height/4,camera.maxY+config.height/4);
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

var util = {
  clamp: function(num, min, max) { return num <= min ? min : num >= max ? max : num },
  loop: function(num,min,max) { while (num < min) num = max - (min - num); while (num > max) num = min + (num - max); return num;},
}

var config = { type: Phaser.AUTO, width: window.innerWidth, height: window.innerHeight, physics: { default: 'arcade' }, scene: [ Scene1 ], antialias: false, };
var game = new Phaser.Game(config);