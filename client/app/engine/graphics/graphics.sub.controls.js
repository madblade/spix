/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.initializeControls = function() {
    var controlsEngine = this.app.engine.controls;
    var selfModel = this.app.model.server.selfModel;
    var worldId = selfModel.worldId;

    // TODO [CRIT] DONT FORGET TO SWITCH CONTROLS ALONG WITH CAMERA.
    this.controls = controlsEngine.getControls('first-person');

    this.addToScene(this.cameraManager.mainWrapper[1], worldId);
    this.addToScene(this.cameraManager.raycasterWrapper[1], worldId);
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
