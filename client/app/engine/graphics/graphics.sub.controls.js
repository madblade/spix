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
