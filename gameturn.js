
pc.script.create('gameturn', function (context) {
    // Creates a new Shakeycamera instance
    var GameTurn = function (entity) {
        this.entity = entity;

        this.currentturn = "preplayer";
        this.turndelay = 0;
    };

    GameTurn.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
            this.gestureprocessor = this.entity.getRoot().findByName("Camera").script.send('gestureprocessor','getComponentReference');
            this.gameHUD = this.entity.script.send('gameHUD','getComponentReference');

        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
            // between each turn there is a short delay
            if (this.turndelay > 0) {
                this.turndelay -= dt;
                return;
            }

            // check whose turn it is, and then see if the current turn is over
            switch (this.currentturn) {
                case "preplayer":
                    this.switchTurn("player");
                    this.gestureprocessor.enableGestures(true);
                    this.gameHUD.setTitleText("Player Turn", true);
                    break;
                case "player":
                    // the player turn lasts until they run out of gesture
                    if (this.gestureprocessor.gesturelengthleft <= 0) {
                        this.gestureprocessor.enableGestures(false);
                        this.switchTurn("precomputer");
                    }
                    break;
                case "precomputer":
                    this.switchTurn("computer");
                    this.gameHUD.setTitleText("Computer Turn", true);
                    break;
                case "computer":
                    this.switchTurn("preplayer");
                    break;
                default:
                    pc.log.write("Unknown turn " + this.currentturn);
                    this.switchTurn("preplayer");
                    break;
            }
        },

        switchTurn: function(newturnname) {
            this.currentturn = newturnname;
            this.turndelay = 0.5;
        }

    };

    return GameTurn;
});