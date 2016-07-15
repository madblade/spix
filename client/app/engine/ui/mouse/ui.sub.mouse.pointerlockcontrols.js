/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupPointerLock = function() {
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
        if (app.stateManager.getState() !== 'ingame') return;

        switch (event.which) {
            case 2: // Middle
                break;
            case 1: // Left
            case 3: // Right
            default:
                return;
        }

        // Ask the browser to lock the pointer.
        event.preventDefault();
        scope.requestPointerLock();
    });
};

App.Engine.UI.prototype.requestPointerLock = function() {
    var b = document.body;
    b.requestPointerLock();

    this.app.uiEngine.startKeyboardListeners();
    this.app.uiEngine.startMouseListeners();
};

App.Engine.UI.prototype.pointerLockChanged = function(isPointerLocked) {
    this.app.uiEngine.threeControlsEnabled = isPointerLocked;
    if (!isPointerLocked) {
        this.app.stateManager.setState('settings');
    }
};
