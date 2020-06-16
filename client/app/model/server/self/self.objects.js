/**
 * Handles loading and updates for objects attached to avatar.
 */

'use strict';

import { ItemsModelModule } from './items';

let SelfObjectsModule = {

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

    updateBow()
    {
        let graphics = this.app.engine.graphics;
        let times = graphics.times;
        let mixers = graphics.mixers;
        let mixer = mixers.get('yumi');
        if (!mixer) return;
        if (this.needsStartLoadingBow)
        {
            mixer.setTime(0);
            mixer.update(0);
            let yumiClip = graphics.clips.get('yumi');
            yumiClip.reset();
            yumiClip.play();
            times.set('yumi', Date.now());
            this.needsStartLoadingBow = false;
            this.needsStopLoadingBow = false;
            this.loadingBow = true;
        }
        else if (this.needsStopLoadingBow)
        {
            this.needsStartLoadingBow = false;
            this.needsStopLoadingBow = false;
            mixer.setTime(0);
            mixer.update(0);
            this.isLoadingBow = false;
        }
        else if (this.isLoadingBow)
        {
            // console.log(mixer._root.morphTargetInfluences);
            let prevTime = times.get('yumi') || Date.now();
            let time = Date.now();
            const delta = (time - prevTime) * 0.001;
            mixer.update(delta);
            times.set('yumi', time);
        }
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
            handItem = graphics.getItemMesh(handItemID, true, false);
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

        this.needsStopLoadingBow = true;
        this.needsStartLoadingBow = false;
    }

};

export { SelfObjectsModule };
