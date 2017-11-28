/**
 *
 */

'use strict';

import extend               from '../../../extend.js';

import { InventoryModule }  from './inventory.js';

let SelfModel = function(app) {
    this.app = app;
    this.xModel = null;

    // General.
    this.entityId = '-1';     // Self default
    this.worldId = '-1';      // Overworld default
    this.oldWorldId = null;

    // Model component.
    this.position = null;
    this.rotation = null;
    // this.inventory = this.getInventory();

    // Graphical component.
    // let graphics = app.engine.graphics;
    this.worldNeedsUpdate = false;
    this.needsUpdate = false;
    this.displayAvatar = false;

    this.avatar = null;
};

extend(SelfModel.prototype, InventoryModule);

extend(SelfModel.prototype, {

    init() {
        let graphics = this.app.engine.graphics;
        this.loadSelf(graphics);
    },

    refresh() {
        if (!this.needsUpdate) return;

        let register = this.app.register;
        let graphics = this.app.engine.graphics;
        let clientModel = this.app.model.client;

        let avatar = this.avatar;
        let up = this.position;
        let r = this.rotation;
        let id = this.entityId;

        if (!graphics.controls || !avatar) return;

        let p = avatar.position;

        if (this.worldNeedsUpdate && this.oldWorldId) {
            console.log('Updating world!');
            console.log(this.worldId);
            let xModel = this.xModel;
            let worldId = this.worldId;
            let oldWorldId = this.oldWorldId;
            let displayAvatar = this.displayAvatar;

            if (displayAvatar) graphics.removeFromScene(avatar, oldWorldId);
            graphics.switchToScene(oldWorldId, worldId);
            xModel.switchAvatarToWorld(oldWorldId, worldId);
            if (displayAvatar) graphics.addToScene(avatar, worldId);
            xModel.forceUpdate = true;
        }

        if (up !== null && r !== null && p !== null) {
            //console.log('Updating position!');
            //console.log(up);

            let animate = p.x !== up[0] || p.y !== up[1];
            p.x = up[0]; p.y = up[1]; p.z = up[2];

            // Notify modules.
            register.updateSelfState({position: [p.x, p.y, p.z]});

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

    updateSelf(p, r, w) {
        w = w.toString();

        let pos = this.position;
        let rot = this.rotation;
        let wid = this.worldId;
        if (!pos || !rot ||
            pos[0] !== p[0] || pos[1] !== p[1] || pos[2] !== p[2] ||
            rot[0] !== r[0] || rot[1] !== r[1])
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

    loadSelf(graphics) {
        // Player id '-1' never used by any other entity.
        let entityId = this.entityId;
        let worldId = this.worldId;

        graphics.initializeEntity(entityId, 'steve', function(createdEntity) {
            let object3d = graphics.finalizeEntity(entityId, createdEntity);
            this.avatar = object3d;
            if (this.displayAvatar) graphics.addToScene(object3d, worldId);
        }.bind(this));
    },

    getSelfPosition() {
        return this.position;
    },

    getHeadPosition() {
        let head = this.avatar.getHead();
        if (!head) return null;
        return head.position;
    }

});

export { SelfModel };
