/**
 * Handles avatar updates.
 */

'use strict';

let SelfUpdateModule = {

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
        const animate = p.x !== newP.x || p.y !== newP.y; // XXX [ANIMATION] manage 3D.
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
    }

};

export { SelfUpdateModule };
