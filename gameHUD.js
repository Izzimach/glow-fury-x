pc.script.create('gameHUD', function (context) {

    var healthbarwidthpixels = 200;
    var healthbarleftoffset = -(healthbarwidthpixels/2);
    var healthbartopoffset = healthbarleftoffset;

    var gesturebarcss = 
        ".gesturebarframe { pointer-events:none; position: absolute; bottom: 10px; left:0; right:0; margin-left:auto; margin-right:auto; "+
            "height: 20px; width: 80%; border: 5px solid black; border-radius: 10px; background: black; } " +

        ".gesturebarbox { pointer-events:none; margin:0; background: #8f8; width:100%; height:100%; border: 0px; border-radius: 5px; } " +

        ".combatactorframe { pointer-events:none; position: absolute; left:0px; top:0px; " +
            "margin-left:"+healthbarleftoffset+"px; " +
            "margin-top:"+healthbartopoffset+"px; " +
            "width:"+healthbarwidthpixels+"px; " +
            "height:15px; border:2px solid grey; background:black; }" +

        ".combatactorbox { pointer-events:none; margin:0px; background: green; width: 100%; height: 100%; border: 0px; } " +

        ".centertitle { pointer-events:none; position:absolute; top:0; bottom:0; left:0; right:0; background: transparent; margin:auto; border: 0px; text-align:center; width:30%; height:20%;"+
        " font-size:xx-large; color:white; transform: scale(2,2); } " +
        ".instructions { z-index:1; position:absolute; top:0; bottom:0; left:0; right:0; margin:auto; border: 12px solid black; background: white; color: black; border-radius: 8px; width:90%; height: 90%; text-align:center; }" +
        ".fitimage { width:60%; }" +
        ".fitimage2 { width:25%; }" +
        ".basicbutton { width:150px; height:80px; border: 8px solid blue; background: blue; color:white; font-size:large;77}" +
        ".restartbutton { position:absolute; bottom:20%; left:0; right:0; margin:auto;}";

        var gameHUD = function (entity) {
        this.entity = entity;
        this.maxgesturevalue = 100;
        this.currentgesturevalue = 100;
        this.combatactors = {};
        this.context = context;
        this.container = document.getElementById('application-container');
    };

    var multiplyMatVec3 = function(v,vw,m,r) {
            if(typeof r === 'undefined') {
              r = pc.math.vec4.create()
            }
            var x, y, z;
            x = v[0] * m[0] + v[1] * m[4] + v[2] * m[8] + vw * m[12];
            y = v[0] * m[1] + v[1] * m[5] + v[2] * m[9] + vw * m[13];
            z = v[0] * m[2] + v[1] * m[6] + v[2] * m[10] + vw * m[14];
            w = v[0] * m[3] + v[1] * m[7] + v[2] * m[11] + vw * m[15];
            r[0] = x;
            r[1] = y;
            r[2] = z;
            r[3] = w;
            return r;
            }

    var worldToScreen = function(cameranode, width, height, point) {
        var projMat, wtm = cameranode.getWorldTransform(), 
            viewMat = pc.math.mat4.invert(wtm), 
            pvm = pc.math.mat4.create(), 
            point2d = pc.math.vec4.create();
        projMat = cameranode.getProjectionMatrix();
        pc.math.mat4.multiply(projMat, viewMat, pvm);
        multiplyMatVec3(point, 1, pvm, point2d);
        var denom = point2d[3] || 1;
        point2d[0] = width / 2 + width / 2 * point2d[0] / denom;
        point2d[1] = height - (height / 2 + height / 2 * point2d[1] / denom);
        point2d[2] = point2d[2] / denom;
        return point2d;
    };

    gameHUD.prototype = {
        initialize: function () {
            // Install the UI styles
            var style = document.createElement('style');
            style.innerHTML = gesturebarcss;
            document.getElementsByTagName("head")[0].appendChild(style);
            console.log("added css");

            //
            // gesture bar show how much gesture is left
            //

            var gesturebar = document.createElement('div');
            gesturebar.className = "gesturebarframe";
            /*div.style.position = 'absolute';
            div.style.width = '500px';
            div.style.top = '90%';
            div.style.left = '50%';
            div.style.marginLeft = '-250px';            
            div.style.textAlign = 'center';
            div.style.color = 'white';
            div.style.fontSize = 'xx-large';*/
            gesturebar.style.visibility = 'hidden';

            var valuebar = document.createElement('div');
            valuebar.className = 'gesturebarbox'
            gesturebar.appendChild(valuebar);

            this.container.appendChild(gesturebar);

            this.gestureframe = gesturebar;
            this.gesturebar = valuebar;

            // Set some default state on the UI element
            //this.setText('GAME OVER');
            this.setVisibility(true);

            this.HUDcamera = this.entity.getRoot().findByName("Camera");

            // displays player/computer turn and victory/defeat text
            var titleblock = document.createElement('div');
            titleblock.className = 'centertitle';
            titleblock.style.visibility = 'hidden';
            this.container.appendChild(titleblock);

            this.centertitle = titleblock;

            // displays instructions

            // first find the images we need
            var images = ['instructions1', 'instructions2'];
            var allassetdata = context.assets.all();
            var nametoasset = function (findname) { return _.find(allassetdata, function(d) { return d.name === findname; })};
            var assettoURL = function(asset) { return asset.getFileUrl(); };
            var imageURLs = images.map(nametoasset).map(assettoURL);

            // yuck

            var instructions = document.createElement('div');
            instructions.id = "instructions";
            instructions.className = 'instructions';
            instructions.style.visibility = 'visible';
            instructions.innerHTML = '<h1>How to Play</h1>' +
                '<p>To charge, drag the mouse from your character to the target enemy.</p>' +
                '<img class="fitimage" src="' + imageURLs[0] + '" /><br>' +
                '<p>After charging, tap the target to attack with quick strikes.</p>' +
                '<img class="fitimage2" src="' + imageURLs[1] + '" /><br>' + 
                '<button class="basicbutton" type="button" onclick="document.getElementById(\'instructions\').style.visibility = \'hidden\';">Start!</button>';

            this.container.insertBefore(instructions, this.container.firstChild);

            // button to press which restarts

        },

        getComponentReference: function () {
            return this;
        },

        update: function(dt) {
            var device = this.context.graphicsDevice;
            var screenwidth = parseInt(device.canvas.style.width);
            var screenheight = parseInt(device.canvas.style.height);

            var healthbarextraverticaloffset = -screenheight * 0.20;

            // reposition combat actor health bars
            _.each(this.combatactors, function(gameobjects, guid, list) {
                var combatactorcomponent = gameobjects.actor;
                var combatactorHUD = gameobjects.HUD;
                var combatactorhealthbar = gameobjects.healthbar;
                var cameranode = this.HUDcamera.camera.camera;
                var screencoords = worldToScreen(cameranode, screenwidth, screenheight, combatactorcomponent.entity.getPosition());
                screencoords[1] = screencoords[1] + healthbarextraverticaloffset;
                combatactorHUD.style.top = screencoords[1].toString() + "px";
                combatactorHUD.style.left = screencoords[0].toString() + "px";

                var percentwidth = combatactorcomponent.health * 100 / combatactorcomponent.maxhealth;
                combatactorhealthbar.style.width = Math.round(percentwidth).toString() + "%";
            }, this);

            // maybe fade out title text
            if (this.fadetitle) {
                this.fadetitletime -= dt;
                if (this.fadetitletime < 0) {
                    this.fadetitle = false;
                    this.centertitle.style.visibility = 'hidden';
                    this.centertitle.id = "";
                }
            }
        },

        // Some utility functions that can be called from other game scripts
        setVisibility: function (visible) {
            this.gestureframe.style.visibility = visible ? 'visible' : 'hidden';
        },

        setGestureMaxValue: function (maxvalue) {
            this.maxgesturevalue = maxvalue;
        },

        setGestureCurrentValue: function (curvalue) {
            this.currentgesturevalue = curvalue;
            var percentwidth = (this.currentgesturevalue * 100) / this.maxgesturevalue;
            this.gesturebar.style.width = Math.round(percentwidth).toString() +"%";
        },

        addCombatActor: function (actorcomponent) {
            var actorbarframe = document.createElement('div');
            actorbarframe.className = 'combatactorframe';

            var actorbarbox = document.createElement('div');
            actorbarbox.className = 'combatactorbox';
            actorbarframe.appendChild(actorbarbox);

            this.container.appendChild(actorbarframe);

            // can't hash by-object, but we can use Guid of the entity
            this.combatactors[actorcomponent.entity.getGuid()] = {actor:actorcomponent,HUD:actorbarframe, healthbar: actorbarbox};
        },

        removeCombatActor: function (actor) {
            var actorid = actor.entity.getGuid();
            var actorHUDdata = this.combatactors[actorid];
            this.container.removeChild(actorHUDdata.HUD);

            delete this.combatactors[actorid];
        },

        setText: function (message) {
            this.div.innerHTML = message;
        },

        setTitleText: function (titletext, fadeout) {
            this.centertitle.innerHTML = titletext;
            this.centertitle.style.visibility = 'visible';
            this.fadetitle = fadeout;
            this.fadetitletime = 2.0;
        },

        addRestartButton: function() {
            var restartbutton = document.createElement('button');
            restartbutton.className = 'basicbutton restartbutton';
            restartbutton.innerHTML = "Restart!";
            restartbutton.onclick = function() {window.location.reload();};
            restartbutton.style.visibility = 'visible';

            this.container.insertBefore(restartbutton, this.container.firstChild);

        }
    };

    return gameHUD;
});