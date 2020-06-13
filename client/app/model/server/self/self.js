/**
 *
 */

'use strict';

import extend                from '../../../extend.js';

import { InventoryModel }    from './inventory.js';
import { Object3D, Vector3, Vector4 } from 'three';
import { ItemsModelModule }  from './items';

let SelfModel = function(app)
{
    this.app = app;
    this.xModel = null;

    // General.
    this.entityId = '-1';     // Self default
    this.worldId = '-1';      // Overworld default
    this.oldWorldId = null;

    // Model component.
    this.position = new Vector3(0, 0, 0);
    this.rotation = [0, 0, 0, 0];
    this.inventoryModel = new InventoryModel();

    // Graphical component.
    this.worldNeedsUpdate = false;
    this.needsUpdate = false;
    this.displayAvatar = false;
    this.displayHandItem = true;

    this.avatar = null;
    this.handItem = null;
    this.handItemWrapper = new Object3D();
    this.handItemWrapper.rotation.reorder('ZYX');

    // Melee mesh
    this.meleeEffectMesh = null;
    this.needsStartMelee = false;
    this.isHittingMelee = false;
    this.meleeWorld = null;

    // Interpolation-prediction
    this.lastPositionFromServer = new Vector3(0, 0, 0);
    this.currentPositionFromServer = new Vector3(0, 0, 0);
    this.interpolatingPosition = new Vector3(0, 0, 0);
    this.lastRotationFromServer = new Vector4(0, 0, 0, 0);
    this.currentRotationFromServer = new Vector4(0, 0, 0, 0);
    this.interpolatingRotation = new Vector4(0, 0, 0, 0);
    this.lastServerUpdateTime = this.getTime();
    this.averageDeltaT = -1;
    this.interpolationUpToDate = false;
    // this.lastInterpolatingPosition = new Vector3(0, 0, 0);
    // this.maxDelta = 500; // ms
    // this.predictedVelocity = new Vector3(0, 0, 0);
    // this.lastClientUpdateTime = this.getTime();
};

extend(SelfModel.prototype, {

    init()
    {
        this.loadSelf();
    },

    _d42(v41, v42)
    {
        const dx = v41.x - v42.x;
        const dy = v41.y - v42.y;
        const dz = v41.z - v42.z;
        const dw = v41.w - v42.w;
        return dx * dx + dy * dy + dz * dz + dw * dw;
    },

    interpolatePredictSelfPosition()
    {
        let lastP = this.lastPositionFromServer;
        let currentP = this.currentPositionFromServer;
        let lastR = this.lastRotationFromServer;
        let currentR = this.currentRotationFromServer;
        let p = this.position;
        let r = this.rotation;
        let upToDatePosition = new Vector3(p.x, p.y, p.z); // "up-to-date" server position
        let upToDateRotation = new Vector4(r[0], r[1], r[2], r[3]); // "up-to-date" rotation
        const updateTime = this.getTime();
        // const deltaClient = updateTime - this.lastClientUpdateTime;
        // this.lastClientUpdateTime = updateTime;

        if (
            currentP.distanceTo(upToDatePosition) > 0 ||
            this._d42(currentR, upToDateRotation) > 0)
        {
            // changed!
            lastP.copy(currentP);
            currentP.copy(upToDatePosition);
            lastR.copy(currentR);
            currentR.copy(upToDateRotation);

            // compute average delta.
            const deltaServer = updateTime - this.lastServerUpdateTime;
            // if (this.averageDeltaT < 16 || this.averageDeltaT > 100) {
            this.averageDeltaT = deltaServer;
            // }
            this.lastServerUpdateTime = updateTime;
        }

        const t = updateTime - this.lastServerUpdateTime;
        const deltaServer = this.averageDeltaT;
        if (t < deltaServer) {
            // interpolate
            const tdt = t / deltaServer;
            const dxp = currentP.x - lastP.x; const dxr = currentR.x - lastR.x;
            const dyp = currentP.y - lastP.y; const dyr = currentR.y - lastR.y;
            const dzp = currentP.z - lastP.z; const dzr = currentR.z - lastR.z;
            const dwr = currentR.w - lastR.w;
            // let pv = this.predictedVelocity;
            // let ip = this.interpolatingPosition;
            // pv.copy(ip);
            this.setLerp(
                lastP.x + tdt * dxp, lastP.y + tdt * dyp, lastP.z + tdt * dzp,
                lastR.x + tdt * dxr, lastR.y + tdt * dyr, lastR.z + tdt * dzr,
                lastR.w + tdt * dwr
            );
            // pv.set(ip.x - pv.x, ip.y - pv.y, ip.z - pv.z);
        }
        // Prediction goes there (but must be queried for every game update,
        // this pass here is already filtered)
        // } else if (t < 2 * deltaServer) {
        //     let pv = this.predictedVelocity;
        //     let ip = this.interpolatingPosition;
        //     this.setLerp(ip.x + pv.x, ip.y + pv.y, ip.z + pv.z);
        //     this.lastInterpolatingPosition.copy(this.interpolatingPosition);
        else if (
            this.interpolatingPosition.distanceTo(currentP) > 0 ||
            this._d42(this.interpolatingRotation, currentR) > 0
        )
        {
            this.setLerp(
                currentP.x, currentP.y, currentP.z,
                currentR.x, currentR.y, currentR.z, currentR.w
            );
            this.interpolationUpToDate = true;
            // }
            // Correction goes there (go back to the last updated)
            // const tdt = (t - 2 * deltaServer) / deltaServer;
            // if (tdt < 1) {
            //     const cp = this.lastInterpolatingPosition;
            //     const dx = last.x - cp.x;
            //     const dy = last.x - cp.y;
            //     const dz = last.x - cp.z;
            //     this.setLerp(last.x + tdt * dx, last.y + tdt * dy, last.z + tdt * dz);
            // } else
        }
    },

    setLerp(xp, yp, zp, xr, yr, zr, wr)
    {
        this.interpolatingPosition.set(xp, yp, zp);
        this.interpolatingRotation.set(xr, yr, zr, wr);
        this.updatePosition(this.avatar, this.interpolatingPosition);
        this.updateRotation(this.avatar, this.interpolatingRotation);
    },

    updatePosition(avatar, newP)
    {
        let register = this.app.register;
        let graphics = this.app.engine.graphics;
        let clientModel = this.app.model.client;
        let handItemWrapper = this.handItemWrapper;
        const id = this.entityId;

        let p = avatar.position;

        // Notify modules.
        register.updateSelfState({ position: [p.x, p.y, p.z] });

        // Update animation.
        const animate = p.x !== newP.x || p.y !== newP.y; // TODO [ANIMATION] manage 3D.
        if (animate) {
            graphics.updateAnimation(id);
            // TODO [ANIMATION] activate hand-held animation
            // graphics.updateAnimation('yumi');
        }
        p.copy(newP);

        // Update camera.
        clientModel.pushForLaterUpdate('camera-position', p);
        graphics.cameraManager.updateCameraPosition(p);

        let handItem = this.handItem;
        if (handItem && handItemWrapper) {
            let mc = graphics.cameraManager.mainCamera;
            handItemWrapper.position.copy(mc.up.position);
        }
    },

    updateRotation(avatar, r)
    {
        let graphics = this.app.engine.graphics;
        let handItemWrapper = this.handItemWrapper;

        avatar.rotation.z = r.z;
        avatar.rotation.x = r.w;
        avatar.getWrapper().rotation.y = Math.PI + r.x;

        let theta0 = r.z;
        let theta1 = r.w;
        let cam = graphics.cameraManager.mainCamera;
        let rotationX = cam.getXRotation();
        const changed = graphics.cameraManager.setAbsRotationFromServer(theta0, theta1);
        // OPT compute delta transmitted from last time;
        // only works when interpolation is switched off.
        // let rotationZ = cam.getZRotation();
        // if (changed) graphics.cameraManager.setRelRotation(rotationZ + r.x - r.y, rotationX);
        if (changed) graphics.cameraManager.setRelRotation(r.x, rotationX);

        // mainCamera.setUpRotation(theta1, 0, theta0);
        // moveCameraFromMouse(0, 0, newX, newY);

        let handItem = this.handItem;
        if (handItem && handItemWrapper)
        {
            let mc = graphics.cameraManager.mainCamera;
            handItemWrapper.rotation.copy(mc.up.rotation);
            handItem.rotation.x = mc.pitch.rotation.x;
            handItem.rotation.z = mc.yaw.rotation.z;
        }
    },

    updateWorld()
    {
        let graphics = this.app.engine.graphics;
        let avatar = this.avatar;
        let handItemWrapper = this.handItemWrapper;

        let xModel = this.xModel;
        let worldId = this.worldId;
        let oldWorldId = this.oldWorldId;
        let displayAvatar = this.displayAvatar;
        let displayHandItem = this.displayHandItem;

        if (displayAvatar) graphics.removeFromScene(avatar, oldWorldId);
        // TODO [GAMEPLAY] differentiate 3d person and 1st person
        if (displayHandItem) graphics.removeFromScene(handItemWrapper, oldWorldId);

        graphics.switchToScene(oldWorldId, worldId);
        xModel.switchAvatarToWorld(oldWorldId, worldId);

        if (displayAvatar) graphics.addToScene(avatar, worldId);
        if (displayHandItem) graphics.addToScene(handItemWrapper, worldId);
        xModel.forceUpdate = true;
    },

    refresh()
    {
        if (!this.needsUpdate)
        {
            if (!this.interpolationUpToDate) this.interpolatePredictSelfPosition();
            if (this.isHittingMelee) this.updateMelee();
            return;
        }

        let avatar = this.avatar;
        // let r = this.rotation;

        if (!avatar) return;

        // This could be made more fluid with
        // a more involved interpolation routine
        // (might need more data from the server)
        if (this.worldNeedsUpdate && this.oldWorldId)
        {
            // TODO [PORTAL] Interpolate position and
            //  only switch to world when the portal is crossed.
            this.updateWorld();
            let p = this.position;
            let last = this.lastPositionFromServer;
            let current = this.currentPositionFromServer;
            last.copy(current);
            current.copy(p);
            this.interpolatingPosition.copy(p);
            this.updatePosition(this.avatar, this.interpolatingPosition);
            this.interpolationUpToDate = true;
        } else if (!this.interpolationUpToDate)
        {
            this.interpolatePredictSelfPosition();
        }

        // if (r !== null) {
        //     this.updateRotation(avatar, r);
        // }

        if (this.needsStartMelee)
        {
            this.needsStartMelee = false;
            this.initMelee();
        }
        if (this.isHittingMelee)
        {
            this.updateMelee();
        }

        this.worldNeedsUpdate = false;
        this.needsUpdate = false;
    },

    initMelee()
    {
        let graphics = this.app.engine.graphics;
        if (!this.meleeEffectMesh)
        {
            let em = this.app.model.server.entityModel;
            this.meleeEffectMesh = em.createMeleeMesh();
        }

        let worldId = this.worldId;
        let mesh = this.meleeEffectMesh;
        if (this.meleeWorld !== null && this.meleeWorld !== worldId)
        {
            graphics.removeFromScene(mesh, this.meleeWorld, true);
        }

        this.meleeWorld = worldId;
        this.isHittingMelee = true;
        let us = mesh.getMesh().material.uniforms;
        us.time.value = 0;

        let p = // this.currentPositionFromServer;
            // graphics.cameraManager.mainCamera.up.position;
            this.avatar.position;
        mesh.position.copy(p);

        graphics.addToScene(mesh, worldId);
    },

    updateMelee()
    {
        let graphics = this.app.engine.graphics;
        let mesh = this.meleeEffectMesh;
        let us = mesh.getMesh().material.uniforms;
        us.time.value += 0.1;
        if (us.time.value < 2.0)
        {
            this.isHittingMelee = true;
            let mc = graphics.cameraManager.mainCamera;
            let p = // this.currentPositionFromServer;
                // this.avatar.position;
                graphics.cameraManager.mainCamera.up.position;
            mesh.position.copy(p);


            mesh.rotation.copy(mc.up.rotation);
            mesh.getWrapper().rotation.x = -Math.PI / 2 + 0.2 + mc.pitch.rotation.x;
            mesh.getWrapper().rotation.z = mc.yaw.rotation.z;
        }
        else
        {
            this.isHittingMelee = false;
            this.meleeWorld = null;
            graphics.removeFromScene(mesh, this.meleeWorld, true);
        }
    },

    cameraMoved(cameraObject)
    {
        let handItem = this.handItem;
        if (!handItem) return;
        handItem.rotation.x = cameraObject.pitch.rotation.x;
        handItem.rotation.z = cameraObject.yaw.rotation.z;
        let handItemWrapper = this.handItemWrapper;
        handItemWrapper.rotation.copy(cameraObject.up.rotation);
        // handItem.children[0].rotation.x += 0.01;
    },

    updateSelf(p, r, w, s)
    {
        w = w.toString();

        let pos = this.position;
        let rot = this.rotation;
        let wid = this.worldId;
        if (!pos || !rot ||
            pos[0] !== p[0] || pos[1] !== p[1] || pos[2] !== p[2] ||
            rot[0] !== r[0] || rot[1] !== r[1])
        {
            this.position.set(p[0], p[1], p[2]);
            this.rotation = r;
            this.needsUpdate = true;
            this.interpolationUpToDate = false;
        }

        if (!wid || wid !== w) {
            this.needsUpdate = true;
            this.worldNeedsUpdate = true;
            this.oldWorldId = this.worldId;
            this.worldId = w;
        }

        if (s) {
            let hasJustMeleed = s[1];
            if (hasJustMeleed)
            {
                console.log('starting melee');
                this.needsStartMelee = true;
            }
        }
    },

    loadSelf()
    {
        let selfModel = this;
        let graphics = this.app.engine.graphics;

        // Player id '-1' never used by any other entity.
        let entityId = this.entityId;
        let worldId = this.worldId;

        let createdEntity = graphics.initializeEntity(
            entityId, 'steve',
            0xffff00
        );
        let object3d = graphics.finalizeEntity(
            entityId, createdEntity,
            0xffff00
        );
        selfModel.avatar = object3d;
        if (selfModel.displayAvatar) graphics.addToScene(object3d, worldId);

        this.updateHandItem();
    },

    updateHandItem()
    {
        let selfModel = this;
        let graphics = this.app.engine.graphics;

        let worldId = this.worldId;
        let handItemID = this.app.model.client.selfComponent.getCurrentItemID();
        let handItem;

        if (ItemsModelModule.isItemNaught(handItemID)) handItem = null;
        else if (ItemsModelModule.isItemRanged(handItemID) || ItemsModelModule.isItemMelee(handItemID) ||
            ItemsModelModule.isItemX(handItemID) || ItemsModelModule.isItemBlock(handItemID)
        ) {
            handItem = graphics.getItemMesh(handItemID, true);
        } else {
            console.warn('[ServerSelf] Handheld item unrecognized.');
            handItem = null;
        }

        // TODO [GAMEPLAY] link hand item and mesh when camera is third person.
        if (selfModel.handItem !== handItem)
        {
            let handItemWrapper = selfModel.handItemWrapper;
            if (selfModel.handItem) // is it possible that it is in another world?
                handItemWrapper.remove(selfModel.handItem);

            selfModel.handItem = handItem;

            if (handItem) {
                handItemWrapper.position.copy(graphics.cameraManager.mainCamera.up.position);
                this.cameraMoved(graphics.cameraManager.mainCamera);
                handItemWrapper.add(handItem);
                if (selfModel.displayHandItem)
                {
                    graphics.addToScene(handItemWrapper, worldId);
                }
            }
        }
    },

    getSelfPosition()
    {
        return this.position;
    },

    getHeadPosition()
    {
        let head = this.avatar.getHead();
        if (!head) return null;
        return head.position;
    },

    getInventory()
    {
        return this.inventoryModel;
    },

    getTime()
    {
        return window.performance.now();
    },

    cleanup()
    {
        // General
        this.entityId = '-1';
        this.worldId = '-1';
        this.oldWorldId = null;

        // Model component.
        this.position = new Vector3(0, 0, 0);
        this.rotation = [0, 0, 0, 0];
        this.inventoryModel.reset();

        // Graphical component.
        this.worldNeedsUpdate = false;
        this.needsUpdate = false;
        this.displayAvatar = false;
        this.displayHandItem = true;

        this.avatar = null;
        this.lastServerUpdateTime = this.getTime();
        this.averageDeltaT = -1;
        // TODO [CLEANUP] avatar graphical component.
    }

});

export { SelfModel };
