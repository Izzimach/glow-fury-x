
pc.script.create('gameturn', function (context) {
    // Creates a new Shakeycamera instance
    var GameTurn = function (entity) {
        this.entity = entity;
    };

    GameTurn.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
            this.gestureprocessor = this.entity.getRoot().findByName("Camera").script.send('gestureprocessor','getComponentReference');
            this.gameHUD = this.entity.script.send('gameHUD','getComponentReference');
            
        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
        }
    };

    return GameTurn;
});