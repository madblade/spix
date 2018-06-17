/**
 * Front-end graphics.
 */

'use strict';

// External dependencies.
import Stats    from 'stats.js';

import extend       from '../../extend.js';

// Base dependencies.
import { CoreModule }  from './core.js';
import { ControlsModule }  from './controls.js';
import { LightModule }  from './light.js';
import { MaterialsModule }  from './materials.js';
import { MeshesModule }  from './meshes.js';
import { TexturesModule }  from './textures.js';
import { EntitiesModule }  from './entities/entites.js';
import { AnimationsModule }  from './entities/animations.js'; // Needed
import { PortalsModule }  from './portals/portals.js';
import { CamerasModule }  from './render/cameras.js';
import { RenderersModule }  from './render/renderer.js';
import { ScenesModule }  from './render/scene.js';
import { FacesModule }  from './terrain/faces.js';
import { ChunksModule }  from './terrain/chunks.js';
import { ShadersModule }  from './shaders/shaders.js';
import { SkyModule }  from './sky/skies.js';

let Graphics = function(app) {
    // App and access to models.
    this.app = app;

    // User customizable settings.
    this.debug = false;

    // Properties.
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    // TODO [LOW] customize newMesh size variable
    this.defaultGeometrySize = 64;

    // Rendering.
    this.requestId          = null;
    this.sceneManager       = this.createSceneManager();
    this.rendererManager    = this.createRendererManager(this);
    this.cameraManager      = this.createCameraManager();

    // Interaction.
    this.controls =     null;

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.rendererManager.renderer.domElement);

    // Benches.
    this.fps = new Stats();
    // document.body.appendChild(this.fps.dom);

    // Animations
    this.initializeAnimations();

    // Textures
    this.loadTextures();

    // Optimizations
    this.portalUpdates = [];
    this.lastRenderPaths = new Set();
    this.lastRenderGates = new Set();
    this.previousFrameWorld = null;
    this.currentFrameWorld = null;
};

extend(Graphics.prototype, CoreModule);
extend(Graphics.prototype, ControlsModule);
extend(Graphics.prototype, LightModule);
extend(Graphics.prototype, MaterialsModule);
extend(Graphics.prototype, MeshesModule);
extend(Graphics.prototype, TexturesModule);
extend(Graphics.prototype, EntitiesModule);
extend(Graphics.prototype, AnimationsModule);
extend(Graphics.prototype, PortalsModule);
extend(Graphics.prototype, CamerasModule);
extend(Graphics.prototype, RenderersModule);
extend(Graphics.prototype, ScenesModule);
extend(Graphics.prototype, FacesModule);
extend(Graphics.prototype, ChunksModule);
extend(Graphics.prototype, ShadersModule);
extend(Graphics.prototype, SkyModule);

export { Graphics };
