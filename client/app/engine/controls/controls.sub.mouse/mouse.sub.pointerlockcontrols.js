/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupPointerLock = function() {
    var app = this.app;

    if (!('webkitPointerLockElement' in document) &&
        !('mozPointerLockElement' in document) &&
        !('pointerLockElement' in document)) return;

    var scope = this;
    var d = document;
    var b = document.body;

    if ('webkitPointerLockElement' in d) {
        b.requestPointerLock = b.webkitRequestPointerLock;
        d.addEventListener('webkitpointerlockchange',
            function() {scope.pointerLockChanged(d.webkitRequestPointerLock === b);}, false);

    } else if ('mozPointerLockElement' in d) {
        b.requestPointerLock = b.mozRequestPointerLock;
        d.addEventListener('mozpointerlockchange',
            function() {scope.pointerLockChanged(d.mozPointerLockElement === b);}, false);

    } else if ('pointerLockElement' in d) {
        d.addEventListener('pointerlockchange',
            function() {scope.pointerLockChanged(d.pointerLockElement === b);}, false);

    } else {
        console.log('ERROR: POINTER LOCK NOT SUPPORTED.');
    }

    $(document).mousedown(function (event) {
        if (app.getState() !== 'ingame' || app.isFocused())
            return;

        switch (event.which) {
            case 1: // Left
                break;
            case 2: // Middle
            case 3: // Right
            default:
                return;
        }

        // Ask the browser to lock the pointer.
        event.preventDefault();
        event.stopPropagation();
        scope.requestPointerLock();
        app.setFocused(true);
    });
};

App.Engine.UI.prototype.requestPointerLock = function() {
    var controlsEngine = this.app.engine.controls;
    var b = document.body;
    b.requestPointerLock();

    controlsEngine.startKeyboardListeners();
    controlsEngine.startMouseListeners();
};

App.Engine.UI.prototype.pointerLockChanged = function(isPointerLocked) {
    var app = this.app;
    app.engine.controls.threeControlsEnabled = isPointerLocked;

    if (!isPointerLocked) {
        app.setState('settings');
        app.setFocused(false);
    }
};
