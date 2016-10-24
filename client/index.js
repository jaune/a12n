var BABYLON = require('babylonjs');

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

    // name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene
    var camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 50, new BABYLON.Vector3(0, 0, 0), scene);

    camera.allowUpsideDown = false;

    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit  = 100;

    camera.lowerBetaLimit = 0.4;
    camera.upperBetaLimit = 1.1;


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
    var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);

    // create a built-in "sphere" shape; its constructor takes 5 params: name, width, depth, subdivisions, scene
    var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);

    // move the sphere upward 1/2 of its height
    sphere.position.y = 1;

    // create a built-in "ground" shape; its constructor takes the same 5 params as the sphere's one
    var ground = BABYLON.Mesh.CreateGround('ground1', 500, 500, 2, scene);

    // BABYLON.Animation.CreateAndStartAnimation("anim", sphere, "position", 30, 120,
    //           sphere.position, sphere.position.add(new BABYLON.Vector3(0, 0, 20)));


    scene.onPointerObservable.add(function (evt) {
        // if the click hits the ground object, we change the impact position
        if (evt.pickInfo.hit && evt.pickInfo.pickedMesh) {
            console.log(evt.pickInfo.pickedMesh);
        }
    }, BABYLON.PointerEventTypes.POINTERDOWN);

    scene.debugLayer.show();

    // return the created scene
    return scene;
}

// call the createScene function
var scene = createScene();

// run the render loop
engine.runRenderLoop(function(){
    scene.render();
});

// the canvas/window resize event handler
window.addEventListener('resize', function(){
    engine.resize();
});