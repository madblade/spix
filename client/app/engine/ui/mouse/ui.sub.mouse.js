/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupMouse = function() {

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
