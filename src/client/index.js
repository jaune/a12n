var BABYLON = require('babylonjs');

var system = {
  belts: [],
  boxes: []
};

// 0, 90, 180, 270

const ORIENTATION_TOP = 0;
const ORIENTATION_RIGHT = 90;
const ORIENTATION_LEFT = 270;
const ORIENTATION_BOTTOM = 180;

for (let i = 0; i < 10; i++) {
  system.belts.push({
    x: -1,
    y: i,
    speed: 1,
    orientation: ORIENTATION_TOP
  });
}

for (let i = 0; i < 10; i++) {
  system.belts.push({
    x: 0,
    y: i,
    speed: 2,
    orientation: ORIENTATION_TOP
  });
}

for (let i = 0; i < 10; i++) {
  system.belts.push({
    x: 1,
    y: i,
    speed: 3,
    orientation: ORIENTATION_TOP
  });
}

system.boxes.push({
  x: -1,
  y: 0,
  display: null,
  move: 0
});

system.boxes.push({
  x: 0,
  y: 0,
  display: null,
  move: 0
});

system.boxes.push({
  x: 1,
  y: 0,
  display: null,
  move: 0
});

shuffleArray(system.boxes);
shuffleArray(system.belts);

function MyCameraKeyboardMoveInput() {
  this.camera = null;

  this._onKeyDown = null;
  this._onKeyUp = null;
  this._onLostFocus = null;

  this.keys = {
    up: false,
    down: false,
    left: false,
    right: false
  };
}

MyCameraKeyboardMoveInput.prototype.attachControl = function (element, noPreventDefault) {
  var self = this;

  this._onKeyUp = function (event) {
    switch (event.keyCode) {
      case 38: self.keys.up = false; break; // UP
      case 40: self.keys.down = false; break; // DOWN
      case 39: self.keys.right = false; break; // RIGHT
      case 37: self.keys.left = false; break; // LEFT
    }

    if (!noPreventDefault) {
      event.preventDefault();
    }
  };

  this._onKeyDown = function (event) {
    switch (event.keyCode) {
      case 38: self.keys.up = true; break; // UP
      case 40: self.keys.down = true; break; // DOWN
      case 39: self.keys.right = true; break; // RIGHT
      case 37: self.keys.left = true; break; // LEFT
    }

    if (!noPreventDefault) {
      event.preventDefault();
    }
  };

  this._onLostFocus = function () {
    self.keys.up = false;
    self.keys.down = false;
    self.keys.left = false;
    self.keys.right = false;
  };

  BABYLON.Tools.RegisterTopRootEvents([
    { name: 'keydown', handler: this._onKeyDown },
    { name: 'keyup', handler: this._onKeyUp },
    { name: 'blur', handler: this._onLostFocus }
  ]);
};

MyCameraKeyboardMoveInput.prototype.detachControl = function (element) {
  BABYLON.Tools.UnregisterTopRootEvents([
      { name: 'keydown', handler: this._onKeyDown },
      { name: 'keyup', handler: this._onKeyUp },
      { name: 'blur', handler: this._onLostFocus }
  ]);
};

MyCameraKeyboardMoveInput.prototype.checkInputs = function (element) {
  if (!this._onKeyDown){
    return;
  }

  var x = 0;
  var y = 0;

  if (this.keys.up) { y += 1; }
  if (this.keys.down) { y -= 1; }

  if (this.keys.right) { x += 1; }
  if (this.keys.left) { x -= 1; }



  if ((x == 0) && (y == 0)) {
    return;
  }

/*
  var result = new BABYLON.Matrix();


  this.camera.getViewMatrix().invertToRef(result);

  var direction = new BABYLON.Vector3(0, 0, 0);

  BABYLON.Vector3.TransformNormalToRef(new BABYLON.Vector3(x, 0, y), result, direction);
*/

  var ivm = new BABYLON.Matrix();
  this.camera.getViewMatrix().invertToRef(ivm);

  var vm = this.camera.getViewMatrix();

  var right = new BABYLON.Vector3(vm.m[0], vm.m[4], vm.m[8]);

  var forward = BABYLON.Vector3.Cross(right, BABYLON.Vector3.Up()).scaleInPlace(y);

  var direction = right.scale(x);

  direction.addInPlace(forward);

  this.camera.target.addInPlace(direction);
};

MyCameraKeyboardMoveInput.prototype.getTypeName = function () {
  return "MyCameraKeyboardMoveInput";
};

MyCameraKeyboardMoveInput.prototype.getSimpleName = function () {
  return "keyboard";
};


BABYLON.MyCameraKeyboardMoveInput = MyCameraKeyboardMoveInput;
BABYLON.CameraInputTypes["MyCameraKeyboardMoveInput"] = MyCameraKeyboardMoveInput;


// get the canvas DOM element
var canvas = document.getElementById('renderCanvas');
var container = document.getElementById('renderContainer');

// load the 3D engine
var engine = new BABYLON.Engine(canvas, true);

// createScene function that creates and return the scene
var createScene = function(){
  // create a basic BJS Scene object
  var scene = new BABYLON.Scene(engine);

  let METRIAL_SELECTED = new BABYLON.StandardMaterial('SELECTED', scene);
  METRIAL_SELECTED.diffuseColor = new BABYLON.Color3(1.0, 0.0, 0.0);

  let METRIAL_GROUND = new BABYLON.StandardMaterial('GROUND', scene);
  METRIAL_GROUND.diffuseColor = new BABYLON.Color3(0.0, 0.5, 0.0);

  let METRIAL_BELT = new BABYLON.StandardMaterial('BELT', scene);
  METRIAL_BELT.diffuseColor = new BABYLON.Color3(0.0, 0.0, 0.3);


  // name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene
  var camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 90, new BABYLON.Vector3(0, 0, 0), scene);

  camera.allowUpsideDown = false;

  camera.lowerRadiusLimit = 20;
  camera.upperRadiusLimit  = 100;

  camera.lowerBetaLimit = 0.4;
  // camera.upperBetaLimit = 1.1;


  camera.inputs.clear();
  camera.inputs.add(new BABYLON.ArcRotateCameraPointersInput());
  camera.inputs.add(new BABYLON.ArcRotateCameraMouseWheelInput());

  // camera.inputs.add(new BABYLON.ArcRotateCameraKeyboardMoveInput());

  camera.inputs.add(new MyCameraKeyboardMoveInput());

  // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
  // var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 10,-50), scene);

  // target the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // attach the camera to the canvas
  camera.attachControl(canvas, false);

  // create a basic light, aiming 0,1,0 - meaning, to the sky
  var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,5,0), scene);

  /*
  var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
  sphere.position.y = 1;
  */
  // BABYLON.Animation.CreateAndStartAnimation("anim", sphere, "position", 30, 120,
  //           sphere.position, sphere.position.add(new BABYLON.Vector3(0, 0, 20)));


  var ground = BABYLON.Mesh.CreateGround('ground1', 500, 500, 2, scene);
  ground.isPickable = false;
  ground.setMaterialByID('GROUND');


  let BOX = BABYLON.MeshBuilder.CreateBox('BOX', {
    width: 3,
    height: 3,
    depth: 3
  }, scene);
  BOX.isPickable = false;
  BOX.isVisible = false;

  BOX.position.y = 1 + 1.5;

  system.boxes.forEach((box, index) => {
    let b = BOX.createInstance('box-'+index);

    b.isPickable = false;
    b.isVisible = true;
    b.position.x = box.x * (4 + 0.5);
    b.position.z = box.y * (4 + 0.5);

    box.display = b;
  });

  // BABYLON.Animation.CreateAndStartAnimation('anim', box, 'position', 30, 120, box.position, box.position.add(new BABYLON.Vector3(0, 0, 5)), false);


  var BELT = BABYLON.MeshBuilder.CreateBox('BELT', {
    width: 4,
    height: 1,
    depth: 4
  }, scene);
  BELT.isPickable = false;
  BELT.isVisible = false;
  BELT.setMaterialByID('BELT');
  BELT.position.y = 0.5;


  system.belts.forEach((belt, index) => {
    let b = BELT.createInstance('belt-'+index);

    b.isPickable = false;
    b.isVisible = true;
    b.position.x = belt.x * (4 + 0.5);
    b.position.z = belt.y * (4 + 0.5);
  });


  scene.onPointerObservable.add(function (evt) {
      // if the click hits the ground object, we change the impact position
      if (evt.pickInfo.hit && evt.pickInfo.pickedMesh) {
        let m = evt.pickInfo.pickedMesh;

        m.setMaterialByID('SELECTED');
        console.log(evt.pickInfo.pickedMesh);

      }
  }, BABYLON.PointerEventTypes.POINTERDOWN);

  // scene.debugLayer.show();

  // return the created scene
  return scene;
}

// call the createScene function
var scene = createScene();

// run the render loop
engine.runRenderLoop(function(){
  system.boxes.forEach((box) => {
    let d = box.display;

    d.position.x = box.x * (4 + 0.5);
    d.position.z = box.y * (4 + 0.5);
  });

  scene.render();
});

// the canvas/window resize event handler
window.addEventListener('resize', function(){
  engine.resize();
});

function findBoxAt(x, y) {
  for (let i in system.boxes) {
    if (system.boxes[i].x === x && system.boxes[i].y === y) {
      return system.boxes[i];
    }
  }
  return null;
}

function isFree(x, y) {
  for (let i in system.boxes) {
    if (system.boxes[i].x === x && system.boxes[i].y === y) {
      return false;
    }
  }
  return true;
}

function shuffleArray(a) {
  var j, x, i;
  for (i = a.length; i; i--) {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
}

function updateSystem() {
  system.boxes.forEach((box) => {
    box.move = 0;
  });

  var move = true;

  while (move) {
    move = false;

    system.belts.forEach((belt) => {
      let box = findBoxAt(belt.x, belt.y);
      if (!box) {
        return;
      }

      let gotoX = belt.x + ((belt.orientation === ORIENTATION_RIGHT)?1:0) + ((belt.orientation === ORIENTATION_LEFT)?-1:0);
      let gotoY = belt.y + ((belt.orientation === ORIENTATION_TOP)?1:0) + ((belt.orientation === ORIENTATION_BOTTOM)?-1:0);

      if (!isFree(gotoX, gotoY)) {
        return;
      }

      if (box.move >= belt.speed) {
        return;
      }

      box.x = gotoX;
      box.y = gotoY;

      box.move++;

      move = true;
    });
  }

  setTimeout(updateSystem, 1000);
}

window.updateSystem = updateSystem;