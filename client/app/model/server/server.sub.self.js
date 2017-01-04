/**
 *
 */

'use strict';

App.Model.Server.SelfModel = function(app) {
    this.app = app;

    // Model component
    this.position = null;
    this.rotation = null;
    this.entityId = '-1';     // Self default
    this.worldId = '-1';      // Overworld default

    // Graphical component
    var graphics = app.engine.graphics;
    this.needsUpdate = false;
    this.displayAvatar = false;

    this.avatar = null;
};

App.Model.Server.SelfModel.prototype.init = function() {
    var graphics = this.app.engine.graphics;
    this.loadSelf(graphics);
};

App.Model.Server.SelfModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;
    var up = this.position;
    var r = this.rotation;
    var id = this.entityId;

    var graphics = this.app.engine.graphics;
    var avatar = this.avatar;

    if (!(graphics.controls) || !avatar) return;
    var p = avatar.position;

    if (up !== null && r !== null && p !== null) {

        var animate = p.x !== up[0] || p.y !== up[1];
        p.x = up[0];
        p.y = up[1];
        p.z = up[2];

        avatar.rotation.y = Math.PI + r[0];

        // Update animation.
        if (animate) graphics.updateAnimation(id);

        // Update camera.
        graphics.cameraManager.positionCameraBehind(up); // Camera wrapper actually
    }

    this.needsUpdate = false;
};

App.Model.Server.SelfModel.prototype.updateSelf = function(p, r) {
    this.position = p;
    this.rotation = r;
    this.needsUpdate = true;
};

App.Model.Server.SelfModel.prototype.loadSelf = function(graphics) {

    // Player id '-1' never used by any other entity.
    var id = this.entityId;

    graphics.initializeEntity(id, 'steve', function(createdEntity) {
        var object3d = graphics.finalizeEntity(id, createdEntity);
        this.avatar = object3d;
        // TODO [CRIT] couple with knot model.
        if (this.displayAvatar) graphics.addToScene(object3d, id);
    }.bind(this));

};
