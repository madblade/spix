/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupMouse = function() {

    this.buttons = {left: 1, middle: 2, right: 3};

    // Click / move handlers.
    this.setupPointerLock();
};

App.Engine.UI.prototype.getControls = function(controlType, camera) {
    var controls;

    if (controlType === 'first-person') {
        controls = this.getFirstPersonControls(camera);
        controls.type = 'fp';
    } else {
        controls = undefined;
    }

    return controls;
};

App.Engine.UI.prototype.startMouseListeners = function() {
    this.registerMouseDown();
    // TODO decouple
    this.app.engine.graphics.controls.startListeners();
};

App.Engine.UI.prototype.stopMouseListeners = function() {
    this.unregisterMouseDown();
    // TODO decouple
    this.app.engine.graphics.controls.stopListeners();
};
