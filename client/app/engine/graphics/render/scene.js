/**
 * Scenes management.
 */

'use strict';

import extend from '../../../extend.js';
import { Scene } from 'three';

let SceneManager = function()
{
    this.mainScene = this.createScene(-1);
    this.subScenes  = new Map();
    this.screens = new Map();
};

extend(SceneManager.prototype, {

    createScene(newSceneId)
    {
        let scene = new Scene();
        scene.sceneId = newSceneId;
        scene.autoUpdate = false;
        return scene;
    },

    // Create and push scene with 'newSceneId' in this.subScenes.
    // If scene exists already (i.e. it's 'mainScene'), simply push it into this.subScenes
    addScene(newSceneId, scene)
    {
        if (!scene) scene = this.createScene(newSceneId);
        this.subScenes.set(newSceneId, scene);
        return scene;
    },

    hasScene(sceneId)
    {
        sceneId = parseInt(sceneId, 10);
        return this.subScenes.has(sceneId);
    },

    // Switch main scene with some scene that must be in this.subScenes
    switchToScene(sceneId, cameraManager, avatar)
    {
        sceneId = parseInt(sceneId, 10);

        let newMainScene = this.subScenes.get(sceneId);
        if (!newMainScene)
        {
            console.log(`Failed to switch to scene ${sceneId}!`);
            return;
        }
        let oldMainScene = this.mainScene;
        let oldMainSceneId = oldMainScene.sceneId;

        this.mainScene = newMainScene;
        this.subScenes.delete(sceneId);
        this.addScene(oldMainSceneId, oldMainScene);

        if (avatar)
        {
            oldMainScene.remove(avatar);
            newMainScene.add(avatar);
        }

        cameraManager.switchMainCameraToWorld(oldMainSceneId, sceneId);
    },

    addObject(object, sceneId)
    {
        let scene = this.getScene(sceneId);
        if (scene && object.parent !== scene) scene.add(object);
    },

    removeObject(object, sceneId, doNotDispose)
    {
        let scene = this.getScene(sceneId);
        if (scene)
        {
            scene.remove(object);
            if (!doNotDispose) {
                if (object.geometry) { object.geometry.dispose(); object.geometry = null; }
                if (object.material) { object.material.dispose(); object.material = null; }
            }
        }
    },

    getScene(sceneId)
    {
        return (
            parseInt(sceneId, 10) === parseInt(this.mainScene.sceneId, 10) ?
                this.mainScene :
                this.subScenes.get(sceneId)
        );
    },

    resize(width, height)
    {
        if (!width) width = window.innerWidth;
        if (!height) height = window.innerHeight;

        let screens = this.screens;
        screens.forEach(function(screen, portalId) {
            if (!screen.isLinked()) {
                console.log(`Not resizing screen ${portalId}.`);
                return;
            }
            let bufferTexture = screen.getRenderTarget();
            bufferTexture.setSize(width, height);
        });
    },

    removeScreen(screenId)
    {
        let screen = this.screens.get(screenId);
        if (!screen) return;

        let scene = this.getScene(screen.getWorldId());
        if (scene) scene.remove(screen);

        // Do not dispose of the object! Later use for screen when we get back to this world.
        this.removeObject(screen.getMesh(), screen.getWorldId(), true);
        // this.screens.delete(screenId);
    },

    cleanup()
    {
        this.mainScene.dispose();
        this.mainScene = this.createScene(-1);
        this.subScenes.forEach(s => {
            s.dispose();
        });
        this.subScenes.clear();
        this.screens.forEach(s => {
            if (s.mesh) {
                s.mesh.geometry.dispose();
                s.mesh.material.dispose();
            }
            if (s.renderTarget) {
                s.renderTarget.dispose();
            }
        });
        this.screens.clear();
    }

});

/** Interface with graphics engine. **/

let ScenesModule = {

    createSceneManager()
    {
        return new SceneManager(this);
    },

    addToShadows(mesh)
    {
        this.rendererManager.addToShadows(mesh);
    },

    removeFromShadows(mesh)
    {
        this.rendererManager.removeFromShadows(mesh);
    },

    addToScene(object3D, sceneId)
    {
        let sceneManager = this.sceneManager;
        if (!sceneId) sceneId = sceneManager.mainScene.sceneId;
        sceneId = parseInt(sceneId, 10);
        sceneManager.addObject(object3D, sceneId);
    },

    removeFromScene(object3D, sceneId, doNotDispose)
    {
        let sceneManager = this.sceneManager;
        if (!sceneId) sceneId = sceneManager.mainScene.sceneId;
        sceneId = parseInt(sceneId, 10);
        sceneManager.removeObject(object3D, sceneId, doNotDispose);
    },

    addScene(newSceneId)
    {
        newSceneId = parseInt(newSceneId, 10);
        let sceneManager = this.sceneManager;

        // Trying to add an existing scene
        if (parseInt(newSceneId, 10) === parseInt(sceneManager.mainScene.sceneId, 10) ||
            sceneManager.subScenes.has(newSceneId))
        {
            // console.log(`Trying to add an existing scene: ${newSceneId}`);
            return;
        }

        return sceneManager.addScene(newSceneId);
    },

    // XXX [UNLOAD] unload scene.
    forgetScene(sceneId)
    {
        let sceneManager = this.sceneManager;

        // Don't delete current scene or a scene that does not exist.
        if (parseInt(sceneId, 10) === parseInt(sceneManager.mainScene.sceneId, 10) ||
            !sceneManager.subScenes.has(sceneId))
        {
            console.log(`Trying to delete main scene or unknown scene: ${sceneId}`);
            return;
        }

        this.subScenes.delete(sceneId);
    },

    getScene(sceneId, force)
    {
        let scene = this.sceneManager.getScene(sceneId);
        if (!scene && force) {
            scene = this.addScene(sceneId);
        }
        return scene;
    },

    addScreen(screenId, screenObject)
    {
        this.sceneManager.screens.set(screenId, screenObject);
    },

    getScreen(screenId)
    {
        return this.sceneManager.screens.get(screenId);
    },

    removeScreen(screenId)
    {
        this.sceneManager.removeScreen(screenId);
    },

    switchToScene(oldSceneId, newSceneId) //, avatar
    {
        // console.log(`Switching from ${oldSceneId} to ${newSceneId}`);
        this.sceneManager.switchToScene(newSceneId, this.cameraManager);
        this.rendererManager.switchAvatarToScene(newSceneId);
        this.previousFrameWorld = parseInt(oldSceneId, 10);
        this.currentFrameWorld = parseInt(newSceneId, 10);
    }

};

export { ScenesModule };
