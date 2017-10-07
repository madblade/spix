/**
 *
 */

'use strict';

App.Model.Server.SelfModel = function(app) {
    this.app = app;
    this.xModel = null;

    // General.
    this.entityId = '-1';     // Self default
    this.worldId = '-1';      // Overworld default
    this.oldWorldId = null;

    // Model component.
    this.position = null;
    this.rotation = null;
    this.inventory = this.getInventory();

    // Graphical component.
    var graphics = app.engine.graphics;
    this.worldNeedsUpdate = false;
    this.needsUpdate = false;
    this.displayAvatar = false;

    this.avatar = null;
};

extend(App.Model.Server.SelfModel.prototype, {

    init: function() {
        var graphics = this.app.engine.graphics;
        this.loadSelf(graphics);
    },

    refresh: function() {
        if (!this.needsUpdate) return;

        var register = this.app.register;
        var graphics = this.app.engine.graphics;
        var clientModel = this.app.model.client;

        var avatar = this.avatar;
        var up = this.position;
        var r = this.rotation;
        var id = this.entityId;

        if (!(graphics.controls) || !avatar) return;

        var p = avatar.position;

        if (this.worldNeedsUpdate && this.oldWorldId) {
            console.log('Updating world!');
            console.log(this.worldId);
            var xModel = this.xModel;
            var worldId = this.worldId;
            var oldWorldId = this.oldWorldId;
            var displayAvatar = this.displayAvatar;

            if (displayAvatar) graphics.removeFromScene(avatar, oldWorldId);
            graphics.switchToScene(oldWorldId, worldId);
            xModel.switchAvatarToWorld(oldWorldId, worldId);
            if (displayAvatar) graphics.addToScene(avatar, worldId);
            xModel.forceUpdate = true;
        }
        
        if (up !== null && r !== null && p !== null) {
            //console.log('Updating position!');
            //console.log(up);

            var animate = p.x !== up[0] || p.y !== up[1];
            p.x = up[0]; p.y = up[1]; p.z = up[2];

            // Notify modules.
            register.updateSelfState({'position': [p.x, p.y, p.z]});

            avatar.rotation.x = r[3];
            avatar.rotation.z = r[2];
            avatar.getWrapper().rotation.y = Math.PI + r[0];

            // Update animation.
            if (animate) graphics.updateAnimation(id);

            // Update camera.
            clientModel.pushForLaterUpdate('camera-position', this.position);
            //clientModel.selfComponent.processChanges();
            graphics.cameraManager.updateCameraPosition(this.position);
        }

        this.worldNeedsUpdate = false;
        this.needsUpdate = false;
    },

    updateSelf: function(p, r, w) {
        w = w.toString();

        var pos = this.position;
        var rot = this.rotation;
        var wid = this.worldId;
        if (!pos || !rot ||
            pos[0] !== p[0] || pos[1] !== p[1] || pos[2] !== p[2]
            || rot[0] !== r[0] || rot[1] !== r[1])
        {
            this.position = p;
            this.rotation = r;
            this.needsUpdate = true;
        }

        if (!wid || wid !== w) {
            this.worldNeedsUpdate = true;
            this.oldWorldId = this.worldId;
            this.worldId = w;
        }
    },

    loadSelf: function(graphics) {

        // Player id '-1' never used by any other entity.
        var entityId = this.entityId;
        var worldId = this.worldId;

        graphics.initializeEntity(entityId, 'steve', function(createdEntity) {
            var object3d = graphics.finalizeEntity(entityId, createdEntity);
            this.avatar = object3d;
            if (this.displayAvatar) graphics.addToScene(object3d, worldId);
        }.bind(this));

    },
    
    getSelfPosition: function() {
        return this.position;
    },
    
    getHeadPosition: function() {
        var head = this.avatar.getHead();
        if (!head) return null;
        return head.position;
    }

});
