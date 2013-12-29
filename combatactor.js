pc.script.create('combatactor', function (context) {

    // data for the various combat actors. The type chosen depends on the name of
    // the containing entity
    var actordescriptors = {
        'BattleBard': {
            startinghealth: 10,
            defaultteam: "player",
            defaultanimation: 'bard_idle',
            defaultanimationspeed: 0.7,
            chargeattack: {
                animationname: 'bard_flipstrike',
                attacksound: 'sword clang 1',
                animationduration: 0.7,
                animationspeed: 5,
                screenshakeat: 0.25,
                damageamount: 1
            },
            strike: {
                animationname: 'bard_strike',
                attacksound: 'sword clang 1',
                animationduration: 0.5,
                animationspeed: 10,
                screenshakeat: 0.15,
                damageamount: 1,
            },
            strike2: {
                animationname: 'bard_spinstrike',
                attacksound: 'sword clang 1',
                animationduration: 0.5,
                animationspeed: 8,
                screenshakeat: 0.1,
                damageamount: 2,
            },
            strike3: {
                animationname: 'bard_bigstrike',
                attacksound: 'sword clang 1',
                animationduration: 0.5,
                animationspeed: 8,
                screenshakeat: 0.1,
                damageamount: 3,
            }
        },
        'Goblin': {
            startinghealth: 5,
            defaultteam: "monsters",
            defaultanimation: 'bard_idle',
            defaultanimationspeed: 0.6,
            strike: {
                animationname: 'bard_bigstrike',
                attacksound: 'clonk',
                animationduration: 0.4,
                animationspeed: 4,
                screenshakeat: 0.2,
                damageamount: 1.5
            }
        }
    };

    var dashspeed = 14.0; // units/second

    // find colliders in this entity and child nodes and set them to link
    // back to this actor
    function linkCollidersToCombatActor(currentnode, linkto) {
        currentnode.script.send('combatactorcollider','setCombatActor', linkto);
        var currentnodechildren = currentnode.getChildren();
        for (var ix=0; ix < currentnodechildren.length; ix++) {
            var childnode = currentnodechildren[ix];
            // only look for colliders on entity objects
            if (pc.fw.Entity.prototype.isPrototypeOf(childnode))
            {
                linkCollidersToCombatActor(currentnodechildren[ix], linkto);
            }
        }
    }

    function disableChildColliders(currentnode) {
        currentnode.script.send('combatactorcollider','disableCollider');
        var currentnodechildren = currentnode.getChildren();
        for (var ix=0; ix < currentnodechildren.length; ix++) {
            var childnode = currentnodechildren[ix];
            // only look for colliders on entity objects
            if (pc.fw.Entity.prototype.isPrototypeOf(childnode))
            {
                disableChildColliders(currentnodechildren[ix]);
            }
        }

    }
    
    // Creates a new Gestureprocessor instance
    var CombatActor = function (entity) {
        this.entity = entity;

        this.descriptor = null;
        this.health = 0;
        this.isalive = true;
        this.colliders = [];

        this.isplayingoneshotanimation = false;
        this.oneshottimeleft = 0;

        this.dashtargetlocation = pc.math.vec3.create();
        this.isdashing = false;

        this.isscreenshakequeued = false;
        this.screenshakeat = 0;
    
        // for tracking combo attacks
        this.combocount = 0;
        this.combotarget = null;
    };

    CombatActor.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
            var entityname = this.entity.getName();
            this.descriptor = actordescriptors[entityname];
            this.team = this.descriptor.defaultteam || "monsters";
            this.health = this.descriptor.startinghealth;
            this.maxhealth = this.health;

            linkCollidersToCombatActor(this.entity, this);

            var mainscenenode = this.entity.getRoot().findByName("Combat Scene");
            mainscenenode.script.send('gameHUD', 'addCombatActor', this);

            this.camera = this.entity.getRoot().findByName("Camera");

            this.playDefaultAnimation();
        },

        getComponentReference: function() {
            return this;
        },
        
        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
            this.manageAnimation(dt);
            this.manageDashing(dt);
            this.manageScreenShakeEvent(dt);
        },

        // called to make the actor perform a certain action
        // target is one of:
        // 1. an entity that is the target of the action
        // 2. an array of entity targets
        // 3. a {x,y,z} target location
        playAction: function (actionname, actiontarget) {
            pc.log.write("action sent:" + actionname + " to combat actor " + this.entity.getName());

            // handle combo strikes
            if (this.combotarget === actiontarget &&
                actionname === "strike")
            {
                this.combocount = (this.combocount % 3) + 1;
                if (this.combocount > 1) {
                    var comboactionname = "strike" + this.combocount.toString();
                    // don't use unless the combo action is available
                    if (typeof this.descriptor[comboactionname] !== "undefined") {
                        actionname = comboactionname;
                    }
                }
            }
            else
            {
                this.combocount = 0;
            }
            this.combotarget = actiontarget;

            // lookup the action; if it exists, process the information in terms of animation, screen shake, etc.
            var actiondata = this.descriptor[actionname];
            if (actiondata) {
                var name = actiondata.animationname || 'bard_strike';
                var duration = actiondata.animationduration || 1;
                var speed = actiondata.animationspeed || this.descriptor.defaultanimationspeed || 1;
                this.playOneShotAnimation(name,duration,speed);

                if (typeof actiondata.screenshakeat !== 'undefined') {
                    this.queueScreenShake(actiondata.screenshakeat);
                }
                this.chargeTarget(actiontarget);

                // deal damage?
                if (actiondata.damageamount) {
                    actiontarget.applyDamage(actiondata.damageamount, this);
                }

                // play sound?
                if (actiondata.attacksound) {
                    this.entity.audiosource.play(actiondata.attacksound);
                }
            }
        },

        applyDamage: function (damageamount, sourceactor) {
            if (!this.isalive) return;

            this.health = this.health - damageamount;
            if (this.health <= 0) {
             this.health = 0;
             this.deathEvent(sourceactor);
            }
        },

        deathEvent: function(sourceactor) {
            this.playOneShotAnimation('bard_falldown', 100.0, 1.0);
            this.entity.animation.loop = false;
            this.isalive = false;
            var mainscenenode = this.entity.getRoot().findByName("Combat Scene");
            mainscenenode.script.send('gameHUD', 'removeCombatActor', this);
            disableChildColliders(this.entity);

        },

        manageAnimation: function (dt) {
            if (this.isplayingoneshotanimation)
            {
                this.oneshottimeleft -= dt;
                if (this.oneshottimeleft < 0 && this.isalive)
                {
                    this.isplayingoneshotanimation = false;
                    // switch back to the default (idle) animation
                    this.playDefaultAnimation();
                }
            }
        },

        playDefaultAnimation: function() {
            this.entity.animation.speed = this.descriptor.defaultanimationspeed;
            this.entity.animation.play(this.descriptor.defaultanimation,0.5);
        },

        playOneShotAnimation: function(name, duration, speed) {
            this.isplayingoneshotanimation = true;
            this.oneshottimeleft = duration;
            this.entity.animation.speed = speed;
            this.entity.animation.play(name,0.1);
        },

        dashTo: function (x,y,z) {
            this.isdashing = true;
            pc.math.vec3.set(this.dashtargetlocation,x,y,z);
        },

        chargeTarget: function (targetactor) {
            // charge to the nearest side
            var mylocation = this.entity.getPosition();
            var targetlocation = targetactor.entity.getPosition();
            targetx = targetlocation[0];

            if (targetx < mylocation[0]) { targetx += 3.5; }
            else if (targetx > mylocation[0]) { targetx -= 3.5; }
            this.dashTo(targetx, targetlocation[1], targetlocation[2]);
        },

        moveTo: function (targetlocation) {
            this.dashTo(targetlocation[0], targetlocation[1], targetlocation[2]);
        },

        manageDashing: function (dt) {
            if (this.isdashing === true) {
                var mylocation = this.entity.getPosition();
                var deltapos = pc.math.vec3.create();
                pc.math.vec3.subtract(this.dashtargetlocation, mylocation, deltapos);
                var distance = pc.math.vec3.length(deltapos);
                if (distance < dashspeed * dt) {
                    this.entity.setPosition(this.dashtargetlocation);
                    this.isdashing = false;
                }
                else
                {
                    var movedelta = pc.math.vec3.create();
                    pc.math.vec3.scale(deltapos, dashspeed * dt, movedelta);
                    var moveresult = pc.math.vec3.create();
                    pc.math.vec3.add(mylocation, movedelta, moveresult);
                    this.entity.setPosition(moveresult);
                }
            }
        },

        queueScreenShake: function (shakewhen) {
            this.isscreenshakequeued = true;
            this.screenshakeat = shakewhen;
        },

        manageScreenShakeEvent: function (dt) {
            if (this.isscreenshakequeued) {
                this.screenshakeat -= dt;
                if (this.screenshakeat < 0) {
                    this.isscreenshakequeued = false;
                    this.camera.script.send('shakeycamera','addShake',1.0);
                }
            }
        }

    };

    return CombatActor;
});