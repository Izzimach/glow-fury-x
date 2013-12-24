pc.script.create('gestureprocessor', function (context) {
    
    // Creates a new Gestureprocessor instance
    var Gestureprocessor = function (entity) {
        this.entity = entity;
        
        // ray start/end instances are create here and reused to avoid creating lots of garbage
        this.raystart = pc.math.vec3.create();
        this.rayend = pc.math.vec3.create();
        this.gesturepath = [];
        this.gesturetargetlist = [];
        this.gesturing = false;
        this.gesturehysteresis = 3;
        this.gesturestats = null;

        this.gesturesallowed = true;
        
        // Disabling the context menu stops the browser displaying a menu when 
        // you right-click the page
        context.mouse.disableContextMenu();

        // Use the on() method to attach event handlers. 
        // The mouse object supports events on move, button down and 
        // up, and scroll wheel.
        context.mouse.on(pc.input.EVENT_MOUSEMOVE, this.onMouseMove, this);
        context.mouse.on(pc.input.EVENT_MOUSEDOWN, this.onMouseDown, this);
        context.mouse.on(pc.input.EVENT_MOUSEUP, this.onMouseUp, this);
    };

    Gestureprocessor.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
            
            //this.target = context.root.findByName("BattleBard");
            this.mainCamera = pc.fw.CameraComponent.camera;
            //console.log(this.target);
            this.gesturestats = this.entity.script.gesturestatistics;

        },
        
        enableGestures: function(enabled) {
            this.gesturesallowed = enabled;

            // if we're in the middle of a gesture nuke it
            if (enabled === false && this.isGesturing === true)
            {
                this.isGesturing = false;
            }

            // some data persists between gestures but is reset at the end of the
            // player turn
            this.gesturetarget = null;
            this.defaultactor = null;
        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
        },
        
        //
        // gesture method calls
        // These are invoked by either the mouse callbacks or touch callbacks depending on which
        // interface is being used.
        //
        
        startGesture: function(screenx, screeny) {
            if (this.gesturesallowed === false) { return; }
            this.isGesturing = true;
            this.gesturetarget = this.findCombatTarget(screenx, screeny);
            this.gesturetargettime = 0;
            this.gesturepath = [ [screenx, screeny] ];
            this.precedinggestures = [];
            this.gesturetargetlist = (this.gesturetarget !== null) ? [this.gesturetarget] : [];
        },
        
        dragGesture: function(screenx, screeny) {
            if (this.gesturesallowed === false) { return; }
            if (this.isGesturing) {
                this.gesturepath.push([screenx, screeny]);
                this.checkGestureTarget(screenx, screeny);
            }
        },
        
        endGesture: function(screenx, screeny) {
            if (this.gesturesallowed === false) { return; }
            if (this.isGesturing)
            {
                this.gesturepath.push([screenx,screeny]);
                this.checkGestureTarget(screenx, screeny);
                this.checkForCompleteGesture(false);
                this.isGesturing = false;
            }
        },
        
        checkGestureTarget: function(screenx, screeny) {
            var target = this.findCombatTarget(screenx, screeny);
            // when the gesture moves over a new target (a new actor, or
            // open space) it has to remain over that new target for a few frames
            // before the new target is commited, to prevent single-frame glitches.
            if (target !== this.gesturetarget)
            {
                this.gesturetarget = target;
                this.gesturetargettime = 1;
            } else {
                this.gesturetargettime += 1;
                if (this.gesturetargettime > this.gesturehysteresis)
                {
                    // add this target if it's not already there
                    if (this.gesturetargetlist.length === 0 ||
                        _.last(this.gesturetargetlist) !== this.gesturetarget) {
                        this.gesturetargetlist.push(this.gesturetarget);
                        console.log("gesture target added: ", this.gesturetarget === null ? "null" : this.gesturetarget.entity.name);
                        if (this.gesturetarget !== null) {
                            this.checkForCompleteGesture(true);
                        }
                    }
                }
            }
        },
        
        checkForCompleteGesture: function(inmidgesture) {
            // grab gesture stats of the gesture path
            var stats = this.gesturestats.analyzeGesture(this.gesturepath);
            
            // is this recognized gesture?
            var gestureclass = this.gesturestats.classifyGesture(this.gesturepath, stats);
            pc.log.write("gesture class=" + gestureclass);

            // process the targets based on attack types
            if (gestureclass === this.gesturestats.STRAIGHTLINE) {
                this.dispatchStraightLineGesture(stats);
                this.precedinggestures.push(gestureclass);
            } else if (gestureclass === this.gesturestats.TAP && !inmidgesture && this.precedinggestures.length < 1) {
                // can't produce "tap" gestures mid-gesture or if the gesture has already produced some action
                this.dispatchTapGesture(stats);
                this.precedinggestures.push(gestureclass);
            }
        },
        
        dispatchStraightLineGesture: function (stats) {
            if (_.last(this.gesturetargetlist) === null) { return; }

            var gestureactors = this.findTwoRecentEnemies();
            if (gestureactors && gestureactors[0].team === "player") {
                var chargesource = gestureactors[0];
                var chargetarget = gestureactors[1];
                chargesource.playAction('chargeattack', chargetarget);

                this.defaultactor = chargesource;

                // reset gesture path and target data to the last target and screen point
                this.gesturepath = [_.last(this.gesturepath)];
            }
        },

        dispatchTapGesture: function (stats) {
            var taptarget = _.last(this.gesturetargetlist);
            if (taptarget &&
                taptarget.team !== "player" &&
                this.defaultactor)
            {
                var striker = this.defaultactor;
                var striketarget = taptarget;
                striker.playAction('strike', striketarget);
            }
        },

        dispatchRightwardCircleGesture: function (stats) {

        },

        dispatchLeftwardCircleGesture: function (stats) {

        },

        findTwoRecentEnemies: function() {
            var validtargets = _.filter(this.gesturetargetlist, function(x){ return (x !== null);});
            if (validtargets.length > 0)
            {
                var chargetarget = _.last(validtargets);

                // the charge source is the most previous gesture target of the opposing team
                var opposingtargets = _.filter(validtargets, function(x){ return (x.team !== chargetarget.team);});

                if (opposingtargets.length > 0) {
                    var chargesource = _.last(opposingtargets);
                    return [chargesource, chargetarget];
                }
            }

            // no valid pair of enemies found
            return false;
        },

        //
        // the mouse bridge: convert mouse events into gesture method calls
        //
        
        onMouseMove: function (event) {
 
            // Finally update the cube's world-space position
            //this.entity.setPosition(this.pos);
            if (context.mouse.isPressed(pc.input.MOUSEBUTTON_LEFT) && this.gesturesallowed)
            {
                //var target = this.findCombatTarget(event.x, event.y);
                //if (target !== null) { console.log(target.getName()); }
                this.dragGesture(event.x,event.y);
            }
        },
 
        onMouseDown: function (event) {

            if (event.button === pc.input.MOUSEBUTTON_LEFT && this.gesturesallowed) {
                this.startGesture(event.x,event.y);
            }

        },
        
        onMouseUp : function (event) {
            if (this.gesturesallowed)
            {
                this.endGesture(event.x,event.y);
            }
        },
        
        findCombatTarget: function(screenx, screeny) {
            var target = null;
            
            // Get the current camera Entity
            var cameraEntity = this.entity;
 
            // Use the camera component's screenToWorld function to convert the 
            // position of the mouse into a position in 3D space
            var depth1 = 0;
            var depth2 = 102;
            
            cameraEntity.camera.screenToWorld(screenx, screeny, depth1, this.raystart);
            cameraEntity.camera.screenToWorld(screenx, screeny, depth2, this.rayend);
            //console.log(this.raystart, this.rayend);
            
            context.systems.rigidbody.raycastFirst(this.raystart, this.rayend, function (result) {
                // Process raycast hit result
                var entity = result.entity;
                var point = result.point;
                var normal = result.normal;
                
                //console.log(entity.getName());
                var collidertarget = result.entity;

                // hopefully there is a link in this collider back to the combat actor
                target = collidertarget.script.send('combatactorcollider','getCombatActor');
                if (typeof target === 'undefined')
                {
                    pc.log.write("error: couldn't find combat actor for collider " + collidertarget.getName());
                    target = null;
                }
            });
            
            return target;
        }
        
    };

    return Gestureprocessor;
});