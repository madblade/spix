/**
 *
 */

'use strict';

import extend                from '../../../extend.js';

import { InventoryModel }    from './inventory.js';
import { Object3D, Vector3, Vector4 } from 'three';
import { SelfInterpolationModule } from './self.interpolate';
import { SelfUpdateModule } from './self.update';
import { SelfObjectsModule } from './self.objects';

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

    // Loading bow
    this.isLoadingBow = false;
    this.needsStartLoadingBow = false;
    this.needsStopLoadingBow = false;

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
    this.needsWorldSwitchRetry = false;
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

    // Called every client frame.
    refresh()
    {
        if (!this.needsUpdate)
        {
            if (!this.interpolationUpToDate) this.interpolatePredictSelfPosition();
            if (this.isHittingMelee) this.updateMelee();
            this.updateBow();
            return;
        }

        let avatar = this.avatar;
        // let r = this.rotation;

        if (!avatar) return;

        // This could be made more fluid with
        // a more involved interpolation routine
        // (might need more data from the server)
        // if (this.worldNeedsUpdate && this.oldWorldId)
        // {
        //     this.updateWorld();
        //     let p = this.position;
        //     let last = this.lastPositionFromServer;
        //     let current = this.currentPositionFromServer;
        //     last.copy(current);
        //     current.copy(p);
        //     this.interpolatingPosition.copy(p);
        //     this.updatePosition(this.avatar, this.interpolatingPosition);
        //     this.interpolationUpToDate = true;
        // } else
        if (!this.interpolationUpToDate)
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
        this.updateBow();

        this.needsUpdate = false;
    },

    // Called every time a server update was received.
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
            this.newWorldId = w;
            // this.worldId = w;
        }

        if (s) {
            let hasJustMeleed = s[1];
            if (hasJustMeleed)
            {
                this.needsStartMelee = true;
            }
            let loadingBow = !!s[2];
            if (loadingBow !== this.isLoadingBow)
            {
                this.isLoadingBow = loadingBow;
                if (this.isLoadingBow)
                {
                    this.needsStartLoadingBow = true;
                    this.needsStopLoadingBow = false;
                }
                else
                {
                    this.needsStopLoadingBow = true;
                    this.needsStartLoadingBow = false;
                }
            }
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
        // XXX [CLEANUP] avatar graphical component.
    }

});

extend(SelfModel.prototype, SelfInterpolationModule);
extend(SelfModel.prototype, SelfUpdateModule);
extend(SelfModel.prototype, SelfObjectsModule);

export { SelfModel };
