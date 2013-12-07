pc.script.create('bindnode', function (context) {
    // Creates a new Bindnode instance
    var Bindnode = function (entity) {
        this.entity = entity;
    };

    Bindnode.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
            
        }
    };

    return Bindnode;
});