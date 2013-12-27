pc.script.create('combatactorcollider', function (context) {

    // used for combat actors with one or more colliders; this basically just provides a link to the combat
    // actor associated with this collider
    var CombatActorCollider = function (entity) {
        this.entity = entity;
        this.combatactor = null;
    };

    CombatActorCollider.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
        },

        setCombatActor: function (actor) {
            this.combatactor = actor;
        },

        getCombatActor: function () {
            return this.combatactor;
        },

        disableCollider: function() {
            this.combatactor = null;
            context.systems.collision.removeComponent(this.entity);
        }
    };

    return CombatActorCollider;
});