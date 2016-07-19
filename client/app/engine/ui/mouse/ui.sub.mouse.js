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
        // TODO handle no controls
        controls = undefined;
    }

    return controls;
};

App.Engine.UI.prototype.startMouseListeners = function() {
    this.registerMouseDown();
    this.app.graphicsEngine.controls.startListeners();
};

App.Engine.UI.prototype.stopMouseListeners = function() {
    this.unregisterMouseDown();
    this.app.graphicsEngine.controls.stopListeners();
};
