pc.script.create('gameHUD', function (context) {

    var gesturebarcss = "#gesturebarframe { position: absolute; bottom: 10px; left:0; right:0; margin:auto; height: 20px; width: 80%; border: 5px solid black; background: black; }"+
        "#gesturebarbox {margin:0; background: #8f8; width:100%; height:100%; border: 0px; margin:0px;}";

    var gameHUD = function (entity) {
        this.entity = entity;
        this.maxgesturevalue = 100;
        this.currentgesturevalue = 100;
    };

    gameHUD.prototype = {
        initialize: function () {
            // Install the UI styles
            var style = document.createElement('style');
            style.innerHTML = gesturebarcss;
            document.getElementsByTagName("head")[0].appendChild(style);
            console.log("added css");

            // Create a div centred inside the main canvas
            var div = document.createElement('div');
            div.id = "gesturebarframe";
            /*div.style.position = 'absolute';
            div.style.width = '500px';
            div.style.top = '90%';
            div.style.left = '50%';
            div.style.marginLeft = '-250px';            
            div.style.textAlign = 'center';
            div.style.color = 'white';
            div.style.fontSize = 'xx-large';*/
            div.style.visibility = 'hidden';

            // create a sub-rectangle that will get re-size to show how much gesture is left
            var valuebar = document.createElement('div');
            valuebar.id = 'gesturebarbox'

            // Grab the div that encloses PlayCanvas' canvas element
            var container = document.getElementById('application-container');
            container.appendChild(div);
            div.appendChild(valuebar);

            this.gestureframe = div;
            this.gesturebar = valuebar;

            // Set some default state on the UI element
            //this.setText('GAME OVER');
            this.setVisibility(true);

            this.setGestureCurrentValue(50);
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

        setText: function (message) {
            this.div.innerHTML = message;
        }
    };

    return gameHUD;
});