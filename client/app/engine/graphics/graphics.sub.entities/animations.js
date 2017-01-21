/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.initializeAnimations = function() {
    this.prevTime = Date.now();
    this.mixers = new Map();
};

App.Engine.Graphics.prototype.updateAnimation = function(entityId) {
    var mixer = this.mixers.get(entityId);
    if (mixer !== undefined) {
        var time = Date.now();
        mixer.update( (time - this.prevTime) * 0.001);
        this.prevTime = time;
    }
};
