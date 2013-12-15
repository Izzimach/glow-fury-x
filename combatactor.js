pc.script.create('combatactor', function (context) {

    // data for the various combat actors. The type chosen depends on the name of
    // the containing entity
    var actordescriptors = {
        'BattleBard': {
            startinghealth: 10,
            defaultanimation: 'bard_idle',
            defaultanimationspeed: 0.7
        },
        'Goblin': {
            startinghealth: 5,
            defaultanimation: 'bard_idle',
            defaultanimationspeed: 0.6
        }
    };

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
    
    // Creates a new Gestureprocessor instance
    var CombatActor = function (entity) {
        this.entity = entity;

        this.descriptor = null;
        this.health = 0;
        this.colliders = [];

        this.playingoneshotanimation = false;
        this.oneshottimeleft = 0;
    };

    CombatActor.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
            var entityname = this.entity.getName();
            this.descriptor = actordescriptors[entityname];
            this.health = this.descriptor.startinghealth;

            linkCollidersToCombatActor(this.entity, this);

            var mainscenenode = this.entity.getRoot().findByName("Combat Scene");
            mainscenenode.script.send('gameHUD', 'addCombatActor', this);

            this.playDefaultAnimation();
        },

        getComponentReference: function() {
            return this;
        },
        
        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
            this.manageAnimation(dt);
        },

        // called to make the actor perform a certain action
        // target is one of:
        // 1. an entity that is the target of the action
        // 2. an array of entity targets
        // 3. a {x,y,z} target location
        playAction: function (actionname, actiontarget) {
            pc.log.write("action sent:" + actionname + " to combat actor " + this.entity.getName());
            this.playOneShotAnimation('bard_bigstrike',0.9,4.0);
        },

        applyDamage: function (damageamount) {

        },

        manageAnimation: function (dt) {
            if (this.playingoneshotanimation)
            {
                this.oneshottimeleft -= dt;
                if (this.oneshottimeleft < 0)
                {
                    this.playingoneshotanimation = false;
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
            this.playingoneshotanimation = true;
            this.oneshottimeleft = duration;
            this.entity.animation.speed = speed;
            this.entity.animation.play(name,0.1);
        }

    };

    return CombatActor;
});