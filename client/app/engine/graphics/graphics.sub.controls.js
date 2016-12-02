/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.initializeControls = function() {
    var controlsEngine = this.app.engine.controls;

    var controls = controlsEngine.getControls('first-person', this.camera);

    this.scene.remove(this.scene.getObjectByName("controls"));
    this.controls = controls;
    this.controls.name = "controls";
    this.scene.add(this.controls.getObject());
};

App.Engine.Graphics.prototype.startListeners = function() {
    this.controls.startListeners();
};

App.Engine.Graphics.prototype.stopListeners = function() {
    this.controls.stopListeners();
};

App.Engine.Graphics.prototype.changeInteraction = function() {

    var model = this.app.model.server.selfModel;
    var avatar = model.avatar;
    var display = !model.displayAvatar;
    model.displayAvatar = display;

    if (display) {
        this.scene.add(avatar);
        this.interaction = 'TP';
    } else {
        this.scene.remove(avatar);
        this.interaction = 'FP';
    }
};
