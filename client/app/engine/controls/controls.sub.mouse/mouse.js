/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupMouse = function() {

    this.buttons = {left: 1, middle: 2, right: 3};

    // Click / move handlers.
    this.setupPointerLock();
};

App.Engine.UI.prototype.getControls = function(controlType) {
    var controls;

    if (controlType === 'first-person') {
        controls = this.getFirstPersonControls();
        controls.type = 'fp';
    } else {
        controls = undefined;
    }

    return controls;
};

App.Engine.UI.prototype.startMouseListeners = function() {
    var graphicsEngine = this.app.engine.graphics;
    graphicsEngine.startListeners();
    this.registerMouseDown();
};

App.Engine.UI.prototype.stopMouseListeners = function() {
    var graphicsEngine = this.app.engine.graphics;
    graphicsEngine.stopListeners();
    this.unregisterMouseDown();
};
