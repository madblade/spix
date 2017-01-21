/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.initializeControls = function() {
    var controlsEngine = this.app.engine.controls;
    var selfModel = this.app.model.server.selfModel;
    var worldId = selfModel.worldId;

    // TODO [CRIT] passify switch camera listeners.
    this.controls = controlsEngine.getControls('first-person');

    this.addToScene(this.cameraManager.mainCamera.get3DObject(), worldId);
    this.addToScene(this.cameraManager.mainRaycasterCamera.get3DObject(), worldId);
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
