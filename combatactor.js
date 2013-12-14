pc.script.create('combatactor', function (context) {

    // data for the various combat actors. The type chosen depends on the name of
    // the containing entity
    var actordescriptors = {
        'BattleBard': {
            startinghealth: 10
        },
        'Goblin': {
            startinghealth: 5
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
        },

        getComponentReference: function() {
            return this;
        },
        
        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
        },

        // called to make the actor perform a certain action
        // target is one of:
        // 1. an entity that is the target of the action
        // 2. an array of entity targets
        // 3. a {x,y,z} target location
        playAction: function (actionname, actiontarget) {
            pc.log.write("action sent:" + actionname + " to combat actor " + this.entity.getName());
        }

    };

    return CombatActor;
});