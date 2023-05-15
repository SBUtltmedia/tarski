/* global AFRAME */

/**
 * Handles events coming from the hand-controls.
 * Determines if the entity is grabbed or released.
 * Updates its position to move along the controller.
 */
delete AFRAME.components['grab']
AFRAME.registerComponent('grab', {
/*    init: function () {
        
        this.GRABBED_STATE = 'grabbed';
        // Bind event handlers
       this.onHit = this.onHit.bind(this);
        // this.el.addEventListener('hit', function(e){
          
        //     this.onHit(e)}
        //     );
        this.el.addEventListener('grab-start', this.onHit);
       this.el.addEventListener('grab-end', this.onGripOpen);
       this.el.addEventListener('mouseleave', this.onGripOpen);
       this.el.addEventListener('mouseup', this.onGripOpen);
       this.el.addEventListener('mouseenter', this.onHit);
       window.hand=null
       this.el.addEventListener('hitstart', this.onHit);
       this.el.addEventListener('hitend', this.onGripOpen);
       this.onGripOpen = this.onGripOpen.bind(this);
        this.onGripClose = this.onGripClose.bind(this);
        this.onThumbUp = this.onThumbUp.bind(this);
        this.onThumbDown = this.onThumbDown.bind(this);
    },

    play: function () {
        var el = this.el;
      
        el.addEventListener('trackpaddown', this.onThumbUp);
        el.addEventListener('trackpadup', this.onThumbDown);
        el.addEventListener('triggerdown', this.onGripClose);
        el.addEventListener('triggerup', this.onGripOpen);
    },

    pause: function () {
        var el = this.el;
        el.removeEventListener('hit', this.onHit);
        el.removeEventListener('trackpaddown', this.onThumbUp);
        el.removeEventListener('trackpadup', this.onThumbDown);
        el.removeEventListener('triggerdown', this.onGripClose);
        el.removeEventListener('triggerup', this.onGripOpen);
    },

    onGripClose: function (evt) {
        this.grabbing = true;
	console.log(evt)
        delete this.previousPosition;
    },
*/

init: function () {
//     startLevel(2);
    this.grabbing=false;
    this.GRABBED_STATE = 'grabbed';
    // Bind event handlers
    this.hitstart = this.onHit.bind(this);
    //this.tick = this.tick.bind(this);
    this.onGripOpen = this.onGripOpen.bind(this);
    this.onGripClose = this.onGripClose.bind(this);
    //this.currentPosition = new THREE.Vector3();
  },

  play: function () {
    var el = this.el;
 //   el.addEventListener('mouseenter', this.onHit);
    el.addEventListener('hitstart', this.onHit);
    el.addEventListener('buttondown', this.onGripClose);
    el.addEventListener('mousedown', this.onGripClose);
    el.addEventListener('buttonup', this.onGripOpen);
    el.addEventListener('mouseup', this.onGripOpen);
  },

  pause: function () {
    var el = this.el;
    el.removeEventListener('hit', this.onHit);
    el.addEventListener('buttondown', this.onGipClose);
    el.addEventListener('buttonup', this.onGripOpen);
  },

  onGripClose: function (evt) {
   console.log(this) 
   if (this.grabbing) { return; }
    this.grabbing = true;
    this.pressedButtonId = evt.detail.id;
    delete this.previousPosition;
  },


    onGripOpen: function (evt) {
	
        var hitEl =window.hitEl;
	this.grabbing = false;
         if (!hitEl ) {
        console.log(window.hitEl)   
	 return;
        }
        var cl = hitEl.getAttribute("class");
        //console.lot(cl)
	if (cl.indexOf("shape") != -1) {
            hitEl.removeState(this.GRABBED_STATE);
            // Get position of the element to be dropped
            var hitElPos = hitEl.getAttribute("position");
            // Snap it to grid
            console.log(hitElPos)
	    var hitElGrid = getGridFromCoords(hitElPos.x, hitElPos.y, hitElPos.z);
            // Check if any other shape is occupying the same space
            var collideID = -1;
            for (var i = 0; i < shapes.length; i++) {
                if (shapes[i].x == hitElGrid.x && shapes[i].y == hitElGrid.y && shapes[i].z == hitElGrid.z) {
                    // Space already occupied
                    collideID = i;
                }
            }
            var id = betterParseInt(hitEl.id);
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
                setTimeout(function () {
                    hitEl.setAttribute("position", collideElSnap);
                }, 100);
            }
            shapes[id].x = hitElGrid.x;
            shapes[id].y = hitElGrid.y;
            shapes[id].z = hitElGrid.z;
            var hitElSnap = getCoordsFromGrid(shapes[id].x, shapes[id].y, shapes[id].z);
            animatePos(hitEl, hitElPos, hitElSnap, 100);
            setTimeout(function () {
                hitEl.setAttribute("position", hitElSnap);
            }, 100);
            totalMoves++;
            if (infiniteMode) {
                infiniteMovesLeft--;
                updateMovesLeftText();
            }
            evaluateWorld();
        } else if (cl.indexOf("lever") != -1) {
            var id = betterParseInt(hitEl.getAttribute("id"));
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
                var id = betterParseInt(hitEl.getAttribute("id"));
                selectInfChoice(id);
            }
        }
	this.grabbing=false;
        hitEl.removeState(this.GRABBED_STATE);

	//window.hitEl = undefined;
        //window.hand=undefined;
    },

    onHit: function (evt) {
        // var hitEl = document.getElementById(evt.target.id)
       //var hitEl = evt.detail.el
        if(!this.grabbing){
        var hitEl = evt.target.components["aabb-collider"]["intersectedEls"][0]
        window.hitEl = hitEl;
        window.hand=evt.srcElement
        hitEl.addState(this.GRABBED_STATE);
}
    },

    onThumbUp: function (evt) {
        // window.hitEl = undefined;
    },

    onThumbDown: function (evt) {
        // Circle pad pressed.
        var hitEl = window.hitEl;
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
      

	var hitEl = window.hitEl;
        var position;
        if (!hitEl || !this.grabbing) {
           window.hitEl=undefined;
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
 		var currentPosition = window.hand.object3D.getWorldPosition(new THREE.Vector3())
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
	 var currentPosition = window.hand.object3D.getWorldPosition(grabPos)
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
