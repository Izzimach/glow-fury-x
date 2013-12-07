//pc.script.attribute('shakeMagnifier','number',0.1);
//pc.script.attribute('shakeDamping','number',1);
//pc.script.attribute('shakeSpringConstant','number',0.01);

pc.script.create('shakeycamera', function (context) {
    // Creates a new Shakeycamera instance
    var Shakeycamera = function (entity) {
        this.entity = entity;
        this.shakevalue = 0.0;
        this.shakevelocity = 0.0;
        
        this.shakeMagnifier = 2;
        this.shakeDamping = 12;
        this.shakeSpringConstant = 700;

        this.baserotation = pc.math.quat.create();
        pc.math.quat.copy(this.entity.getLocalRotation(), this.baserotation);
        this.shakerotation = pc.math.quat.create();
        this.modifiedrotation = pc.math.quat.create();
        
        this.baseposition = pc.math.vec3.create();
        pc.math.vec3.copy(this.entity.getLocalPosition(), this.baseposition);
        this.shakeposition = pc.math.vec3.create();
        this.modifiedposition = pc.math.vec3.create();

        this.shakeaxis = pc.math.vec3.create(1,0,0);
    };

    Shakeycamera.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
            var shakedamping = (1.0 - dt * this.shakeDamping);
            if (shakedamping < 0) { shakedamping = 0; }
            
            this.shakevelocity = this.shakevelocity  * shakedamping - this.shakevalue * this.shakeSpringConstant * dt;
            this.shakevalue = this.shakevalue + dt * this.shakevelocity;
            
            //pc.math.quat.fromAxisAngle(this.shakeaxis, this.shakevalue * this.shakeMagnifier, this.shakerotation);
            pc.math.quat.fromEulerXYZ(0,0,this.shakevalue * this.shakeMagnifier,this.shakerotation);
            pc.math.quat.multiply(this.baserotation, this.shakerotation, this.modifiedrotation);
            
            this.entity.setLocalRotation(this.modifiedrotation);
            
            pc.math.vec3.set(0,this.shakeposition, this.shakevalue * this.shakeMagnifier, 0);
            pc.math.vec3.add(this.baseposition, this.shakeposition, this.modifiedposition);
            
            this.entity.setLocalPosition(this.modifiedposition);
        },
        
        addShake: function(shakeamplitude) {
            console.log("shake", shakeamplitude);
            this.shakevalue = this.shakevalue + shakeamplitude;
        }
    };

    return Shakeycamera;
});