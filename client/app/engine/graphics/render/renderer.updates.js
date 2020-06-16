/**
 * Functions called at every render pass.
 */

'use strict';

let RendererUpdates = {

    darkenNonBloomed(obj, materials)
    {
        if (obj.isMesh && obj.userData.bloom !== true) {
            materials[obj.uuid] = obj.material;
            obj.material = this.darkMaterial;
        }
    },

    restoreMaterial(obj, materials)
    {
        if (materials[obj.uuid]) {
            obj.material = materials[obj.uuid];
            delete materials[obj.uuid];
        }
    },

    updateSkies(mainCamera)
    {
        let skies = this.graphics.app.model.server.chunkModel.skies;
        skies.forEach((sky, worldId) => {
            // TODO [SKY] manage with other cameras
            this.graphics.updateSunPosition(mainCamera, sky, worldId);
        });
    },

    updateWaters(cameraManager, renderer, mainScene, mainCam)
    {
        // Update uniforms
        let worlds = this.graphics.app.model.server.chunkModel.worlds;
        let skies = this.graphics.app.model.server.chunkModel.skies;
        let eye = cameraManager.waterCamera.eye;
        worlds.forEach(w => {
            // let sky = skies.get(wid);
            // let sdir = this.graphics.getSunDirection(sky);
            w.forEach(chunk => { let m = chunk.meshes; for (let i = 0; i < m.length; ++i) {
                if (!chunk.water[i]) continue;
                let mi = m[i];
                mi.visible = false;
                // if (mi.material && mi.material.uniforms && mi.material.uniforms.time)
                // {
                //     mi.material.uniforms.eye.value = eye;
                //     mi.material.uniforms.sunDirection.value = sdir;
                //     mi.material.uniforms.time.value += 0.01;
                // }
            }});
        });

        // Update main camera
        this.updateWaterCamera(cameraManager, renderer, mainScene, mainCam);

        // Update display
        worlds.forEach((w, wid) => { w.forEach(chunk => {
            let m = chunk.meshes;
            let sky = skies.get(wid);
            let sdir = this.graphics.getSunDirection(sky);
            for (let i = 0; i < m.length; ++i) {
                if (chunk.water[i])
                {
                    let mi = m[i];
                    mi.visible = true;
                    if (mi.material && mi.material.uniforms && mi.material.uniforms.time)
                    {
                        mi.material.uniforms.eye.value = eye;
                        mi.material.uniforms.sunDirection.value = sdir;
                        mi.material.uniforms.time.value += 0.01;
                    }
                }
            }
        });
        });
    },

    updateWaterCamera(cameraManager, renderer, mainScene)
    {
        // Update mirror camera
        cameraManager.updateWaterCamera();

        // Perform render
        let scene = mainScene;
        let waterCamera = cameraManager.waterCamera;
        let renderTarget = waterCamera.waterRenderTarget;
        let mirrorCamera = cameraManager.waterCamera.camera;

        // Save
        let currentRenderTarget = renderer.getRenderTarget();
        let currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
        // let currentXrEnabled = renderer.xr.enabled;
        // scope.visible = false; // single side, no need
        // renderer.xr.enabled = false; // Avoid camera modification and recursion
        renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

        renderer.setRenderTarget(renderTarget);
        if (renderer.autoClear === false) renderer.clear();
        renderer.render(scene, mirrorCamera);

        // Restore
        // scope.visible = true; // single side, no need
        // renderer.xr.enabled = currentXrEnabled;
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
        renderer.setRenderTarget(currentRenderTarget);
        // let viewport = camera.viewport;
        // if (viewport !== undefined) {
        //     renderer.state.viewport(viewport);
        // }
    },

    updateShadows() // cameraManager)
    {
        let graphics = this.graphics;
        let worlds = graphics.app.model.server.chunkModel.worlds;
        let skies = graphics.app.model.server.chunkModel.skies;
        // let eye = cameraManager.waterCamera.eye;
        let eye = graphics.getCameraCoordinates();
        // let eyedir = cameraManager.mainCamera.getCameraForwardVector();
        worlds.forEach((w, wid) => {
            let sky = skies.get(wid);
            let sdir = graphics.getSunDirection(sky);
            sdir.set(-sdir.x, sdir.y, sdir.z).negate();
            w.forEach(chunk => {
                if (!chunk.shadow) return;
                let mi = chunk.shadow;
                if (mi.material && mi.material.uniforms)
                {
                    mi.material.uniforms.lightPosition.value = sdir;
                    mi.material.uniforms.eyePosition.value = eye;
                }
            });
        });
    }

};

export { RendererUpdates };
