/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.initializeControls = function() {
    var controlsEngine = this.app.engine.controls;

    // TODO [CRIT] couple with knot model, DONT FORGET TO SWITCH CONTROLS ALONG WITH CAMERA.
    var controls = controlsEngine.getControls('first-person', this.cameraManager);

    var oldControlsObject = this.sceneManager.mainScene.getObjectByName('controls');
    if (oldControlsObject) this.removeFromScene(oldControlsObject, -1);
    this.controls = controls;
    this.controls.name = 'controls';
    this.addToScene(this.controls.getObject()[0], -1);
    this.addToScene(this.controls.getObject()[1], -1);
};

App.Engine.Graphics.prototype.startListeners = function() {
    this.controls.startListeners();
};

App.Engine.Graphics.prototype.stopListeners = function() {
    this.controls.stopListeners();
};

App.Engine.Graphics.prototype.changeAvatarVisibility = function(display, avatar, worldId) {
    if (display)
        this.addToScene(avatar, worldId);
    else
        this.removeFromScene(avatar, worldId);
};
