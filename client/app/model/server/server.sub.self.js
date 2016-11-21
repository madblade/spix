/**
 *
 */

'use strict';

App.Model.Server.SelfModel = function(app) {
    this.app = app;

    // Model component
    this.position = null;
    this.rotation = null;
    this.id = null;

    // Graphical component
    var graphics = app.engine.graphics;
    this.needsUpdate = false;
    this.displayAvatar = false;

    this.avatar = graphics.createMesh(
        graphics.createGeometry('box'),
        graphics.createMaterial('flat-phong')
    );
};

App.Model.Server.SelfModel.prototype.init = function() {
    var graphics = this.app.engine.graphics;

    if (this.displayAvatar)
        graphics.scene.add(this.avatar);
};

App.Model.Server.SelfModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;
    var p = this.position;
    var r = this.rotation;

    var graphics = this.app.engine.graphics;
    var controls = graphics.controls;
    if (p !== null && r !== null && controls !== null) {
        // TODO exclude player according to camera type.
        this.avatar.position.x = p[0];
        this.avatar.position.y = p[1];
        this.avatar.position.z = p[2] + .5;

        // TODO ignore self.camerarotation
        // this.avatar.rotation.z = r[0];
        graphics.positionCameraBehind(controls.getObject(), p); // Camera wrapper actually
    }

    this.needsUpdate = false;
};

App.Model.Server.SelfModel.prototype.updateSelf = function(p, r) {
    this.position = p;
    this.rotation = r;
    this.needsUpdate = true;
};
