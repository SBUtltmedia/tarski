/* global AFRAME */

/**
 * Handles events coming from the hand-controls.
 * Determines if the entity is grabbed or released.
 * Updates its position to move along the controller.
 */
delete AFRAME.components['grab']
AFRAME.registerComponent('grab', {

init: function () {
//     startLevel(2);
    this.dragPlane=null; 
    this.grabbing=false;
    // Bind event handlers
    //this.tick = this.tick.bind(this);
    this.onGripOpen = this.onGripOpen.bind(this);
    this.onGripClose = this.onGripClose.bind(this);
    //this.currentPosition = new THREE.Vector3();
  },

  play: function () {
    var el = this.el;
 //   el.addEventListener('mouseenter', this.onHit);
    el.addEventListener('buttondown', this.onGripClose);
    el.addEventListener('mousedown', this.onGripClose);
    el.addEventListener('buttonup', this.onGripOpen);
    el.addEventListener('mouseup', this.onGripOpen);
  },

  pause: function () {
    var el = this.el;
    el.addEventListener('buttondown', this.onGipClose);
    el.addEventListener('buttonup', this.onGripOpen);
  },

  onGripClose: function (evt) {
    if (this.grabbing) { return; }
	if(evt.type=="mousedown"){
	this.hitEl= evt.detail.intersectedEl;
	}
	else{
        this.hitEl = evt.target.components["aabb-collider"]["intersectedEls"][0]
	}   
 if (!this.hitEl) {return}
	var sceneEl = document.querySelector('a-scene');
	this.dragPlane = document.createElement('a-plane');
        this.dragPlane.setAttribute('look-at','[camera]')
	this.dragPlane.setAttribute('id','dragPlane')
	 this.dragPlane.setAttribute('opacity',0)
	this.dragPlane.setAttribute('position',this.hitEl.getAttribute('position'))
	sceneEl.appendChild(this.dragPlane);
 	var cursor = document.querySelector('[cursor]')
	cursor.components.raycaster.refreshObjects();
	this.hand=evt.srcElement
    	this.grabbing = true;
  },


    onGripOpen: function (evt) {
	var hitEl = this.hitEl
	this.grabbing = false;
         if (!this.hitEl) {
	 return;
        }
        
	if(this.hitEl.hasAttribute("look-at")){return}	
	var cl = this.hitEl.getAttribute("class");
	if (cl.indexOf("shape") != -1) {
            // Get position of the element to be dropped
            var hitElPos = this.hitEl.getAttribute("position");
            // Snap it to grid
	    var hitElGrid = getGridFromCoords(hitElPos.x, hitElPos.y, hitElPos.z);
            // Check if any other shape is occupying the same space
            var collideID = -1;
            for (var i = 0; i < shapes.length; i++) {
                if (shapes[i].x == hitElGrid.x && shapes[i].y == hitElGrid.y && shapes[i].z == hitElGrid.z) {
                    // Space already occupied
                    collideID = i;
                }
            }
            var id = betterParseInt(this.hitEl.id);
            // If no shape is occupying the new space, move it to that space (otherwise swap it with the hit shape)
            var temp = {
                x: shapes[id].x,
                y: shapes[id].y,
                z: shapes[id].z
            }
            if (collideID > -1) {
                var collideEl = document.querySelector("#shape" + collideID);
                var collideElPos = collideEl.getAttribute("position");
                shapes[collideID].x = temp.x;
                shapes[collideID].y = temp.y;
                shapes[collideID].z = temp.z;
                var collideElSnap = getCoordsFromGrid(shapes[collideID].x, shapes[collideID].y, shapes[collideID].z);
                animatePos(collideEl, collideElPos, collideElSnap, 100);
                setTimeout( function() {
                    hitEl.setAttribute("position", collideElSnap);
                }, 100);
            }
            shapes[id].x = hitElGrid.x;
            shapes[id].y = hitElGrid.y;
            shapes[id].z = hitElGrid.z;
            var hitElSnap = getCoordsFromGrid(shapes[id].x, shapes[id].y, shapes[id].z);
            animatePos(this.hitEl, hitElPos, hitElSnap, 100);
            setTimeout( function () {
                hitEl.setAttribute("position", hitElSnap);
            }, 100);
            totalMoves++;
            if (infiniteMode) {
                infiniteMovesLeft--;
                updateMovesLeftText();
            }
            evaluateWorld();
        } else if (cl.indexOf("lever") != -1) {
            var id = betterParseInt(this.hitEl.getAttribute("id"));
            var leverPos = $("#lever" + id).attr("position");
            if (id == 0) {
                // Start game lever
                if (leverPos.y <= -.4) {
                    playGameIntro();
                }
            } else if (id >= 1 && id <= 5) {
                // Select level
                if (leverPos.y <= -.4) {
                    startLevel(id);
		}
            } else if (id == 6) {
                // Start infinite mode
                if (leverPos.y <= -.4) {
                    hideLevelSelect();
                    raiseMachineArms();
                    setTimeout(function () {
                        startInfiniteMode();
                    }, 1000);
                }
            } else if (id == 7) {
                // Exit level
                if (leverPos.y <= -.4) {
                    if (infiniteMode) {
                        // Concede infinite mode
                        endInfiniteMode(true);
                    } else {
                        // Exit level (1 through 5)
                        exitLevel();
                    }
                }
            }
        } else if (cl.indexOf("infChoiceBox") != -1) {
            if (infiniteMode) {
                var id = betterParseInt(this.hitEl.getAttribute("id"));
                selectInfChoice(id);
            }
        }
	this.grabbing=false;
	if(this.dragPlane){
	this.dragPlane.parentNode.removeChild(this.dragPlane)
	this.dragPlane=null;
	}
	//this.hitEl = undefined;
        //this.hand=undefined;
    },
    onThumbUp: function (evt) {
        // this.hitEl = undefined;
    },

    onThumbDown: function (evt) {
        // Circle pad pressed.
        var hitEl = this.hitEl;
        if (hitEl && this.grabbing) {
            var id = betterParseInt(hitEl.getAttribute("id"));
            // Invert inWorld property of the shape
            var shape = shapes[id];
            if (shape.inWorld) {
                // Shape is in the world, see if it can be ghosted
                if (ghostShapes < ghostLimit) {
                    ghostShapes++;
                    shape.inWorld = false;
                    pulseGhostPanel();
                } else {
                    // Notify the user that the limit has been reached
                    shakeGhostPanel();
                }
            } else {
                // Shape is not in the world; ghost it
                ghostShapes--;
                shape.inWorld = true;
                pulseGhostPanel();
            }
            if (shape.inWorld) {
                $("#shape" + id).attr("opacity", 1);
            } else {
                $("#shape" + id).attr("opacity", .2);
            }
            $("#ghostCountNumber").attr("text", "value: " + ghostShapes + "; color: #ffffff; align: right");
        }
    },

    tick: function () {
      

	var hitEl = this.hitEl;
	var position;
        if (!hitEl || !this.grabbing) {
           this.hitEl=undefined;
            return;
        }
        this.updateDelta();
        var cl = hitEl.getAttribute("class");
        if (cl !== undefined) {

            if (cl.indexOf("lever") != -1) {


                var id = betterParseInt(hitEl.getAttribute("id"));
                // console.log(this.deltaPosition.y)
                position = hitEl.getAttribute('position');
                var leverEl = document.querySelector("#lever" + id);
                var leverPos = $("#lever" + id).attr("position");
                var newPos = {
                    x: leverPos.x,
                    y: Math.min(0, Math.max(-.4, leverPos.y + this.deltaPosition.y)),
                    z: leverPos.z
                };
                leverEl.setAttribute('position', newPos);
                if (newPos.y <= -.4) {
                    this.onGripOpen();
                }
            } else if (cl.indexOf("shape") != -1) {
                position = hitEl.getAttribute('position');
 		        if (this.hand.hasAttribute("cursor")){
        		var cursor = document.querySelector('[cursor]');
        	var mousePosition = cursor.components.raycaster.getIntersection(this.dragPlane);
		if(!mousePosition){return}
		this.dragPlane.setAttribute('position',this.hitEl.getAttribute('position'))
		var currentPosition= mousePosition.point
		/*
		{
                    x: position.x + this.deltaPosition.x*.2,
                    y: position.y + this.deltaPosition.y*.2,
                    z: position.z + this.deltaPosition.z*.2
                }
		*/
		//currentPosition.z=  (hitEl.getAttribute('position').z+mousePosition.point.z)/2;
		}
	else{
		var currentPosition = this.hand.object3D.getWorldPosition(new THREE.Vector3())
        }     
	   hitEl.setAttribute('position', {
                    x: currentPosition.x,
                    y:currentPosition.y,
                    z: currentPosition.z
                 });
		/*hitEl.setAttribute('position', {
                    x: position.x + this.deltaPosition.x,
                    y: position.y + this.deltaPosition.y,
                    z: position.z + this.deltaPosition.z
                });*/

            } else {

            }
        }
    },
/*  updateDelta: function () {
    var currentPosition = this.currentPosition;
    this.el.object3D.updateMatrixWorld();
    currentPosition.setFromMatrixPosition(this.el.object3D.matrixWorld);
    if (!this.previousPosition) {
      this.previousPosition = new THREE.Vector3();
      this.previousPosition.copy(currentPosition);
    }
    var previousPosition = this.previousPosition;
    var deltaPosition = {
      x: currentPosition.x - previousPosition.x,
      y: currentPosition.y - previousPosition.y,
      z: currentPosition.z - previousPosition.z
    };
    this.previousPosition.copy(currentPosition);
    this.deltaPosition = deltaPosition;
  }
*/
    updateDelta: function () {
        var grabPos = new THREE.Vector3()
	if (this.hand.hasAttribute("cursor")){
	var cursor = document.querySelector('[cursor]');
	var elToWatch = this.hitEl;
	var intersection = cursor.components.raycaster.getIntersection(elToWatch);
	if (!intersection){return}
	var currentPosition = intersection.point;
	}
	else{
	 var currentPosition = this.hand.object3D.getWorldPosition(grabPos)
        }
	// console.log(currentPosition)
        var previousPosition = this.previousPosition || currentPosition;
        var deltaPosition = {
      x: currentPosition.x - previousPosition.x,
      y: currentPosition.y - previousPosition.y,
      z: currentPosition.z - previousPosition.z
    };

	this.previousPosition = Object.assign({},currentPosition);
        this.deltaPosition = deltaPosition;
    }
});
