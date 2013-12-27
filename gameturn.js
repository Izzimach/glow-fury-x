
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
                    // all enemies dead?
                    if (!this.anyLeftOnTeam("monsters")) {
                        this.gameHUD.setTitleText("Victory!");
                        this.switchTurn("gameover");
                    }
                    break;
                case "precomputer":
                    this.switchTurn("computer");
                    this.gameHUD.setTitleText("Computer Turn", true);
                    var actorteams = _.chain(this.gameHUD.combatactors).values().pluck('actor').groupBy('team').value();
                    this.enemiesattacking = actorteams.monsters;
                    this.enemiesresetting = [];
                    this.playertargets = actorteams.player;
                    this.timetonextenemyattack = 0.5;
                    break;
                case "computer":
                    this.computerAttacks(dt);
                    if (this.enemiesattacking.length < 1 &&
                        this.enemiesresetting.length < 1) {
                        this.switchTurn("preplayer");
                    }
                    // player dead?
                    if (!this.anyLeftOnTeam("player")) {
                        this.gameHUD.setTitleText("Defeat!");
                        this.switchTurn("gameover");
                    }
                    break;
                case "gameover":
                    {}
                    break;
                default:
                    pc.log.write("Unknown turn " + this.currentturn);
                    this.switchTurn("preplayer");
                    break;
            }
        },

        anyLeftOnTeam: function (teamname) {
            var actors = _.values(this.gameHUD.combatactors);
            return _.some(actors, function(x) {return x.actor.team === teamname;});
        },

        computerAttacks: function (dt) {
            if (this.timetonextenemyattack > 0) {
                this.timetonextenemyattack -= dt;
                return;
            }

            // reset any enemies that have already attacked
            if (this.enemiesresetting.length > 0) {
                var nextreset = _.first(this.enemiesresetting);
                this.enemiesresetting.splice(0,1);

                nextreset.moveTo(nextreset.startposition);
            }

            if (this.enemiesattacking.length > 0) {
                var nextattacker = _.first(this.enemiesattacking);
                this.enemiesattacking.splice(0,1);

                var playertarget = this.playertargets[0];

                nextattacker.startposition = pc.math.vec3.clone(nextattacker.entity.getPosition());
                nextattacker.playAction('strike', playertarget);
                this.enemiesresetting.push(nextattacker);
            }

            this.timetonextenemyattack = 0.5;
        },

        switchTurn: function(newturnname) {
            this.currentturn = newturnname;
            this.turndelay = 0.5;
        }

    };

    return GameTurn;
});