/**
 * Core methods.
 */

'use strict';

import Stats from 'stats.js';

let CoreModule = {
    run() {
        // Initialize DOM element
        this.initializeDOM();
        this.fps = new Stats();

        // Controls are tightly linked to camera.
        this.initializeControls();

        // Init animation.
        this.resize();
        this.animate();

        // Init stats.
        // Benches.
        // document.body.appendChild(this.fps.dom);
    },

    initializeDOM() {
        this.container = document.getElementById('container');
        this.container.appendChild(this.rendererManager.renderer.domElement);
    },

    /** Main loop. **/

    animate() {
        let clientModel = this.app.model.client;
        let serverModel = this.app.model.server;

        // Request animation frame.
        this.requestId = requestAnimationFrame(this.animate.bind(this));

        // Bench.
        this.fps.update();

        // Render.
        serverModel.refresh();
        this.render();
        clientModel.refresh();

        // Rendering twice fixes inertia artifacts on WebGL render targets AND I DON'T KNOW WHY.
        // Perf loss is visually compensated by the decoupled camera movement aggregation scheme.
        //serverModel.refresh();
        // this.render();
        //clientModel.refresh();
    },

    render() {
        let sceneManager = this.sceneManager;
        let cameraManager = this.cameraManager;
        let rendererManager = this.rendererManager;
        let portals = this.app.model.server.xModel.portals;

        // Refresh portals.
        this.processPortalUpdates();

        // Refresh camera mouse movements.
        cameraManager.refresh();

        // Perform rendering.
        rendererManager.render(sceneManager, cameraManager, portals);
    },

    stop() {
        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
        }
    },

    cleanupFullGraphics() {
        this.sceneManager.cleanup();
        this.cameraManager.cleanup();
        this.rendererManager.cleanup();
    },

    resize() {
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Update aspects.
        this.cameraManager.resize(width, height);

        // Update main renderer.
        this.rendererManager.resize(width, height);

        // Resize render targets.
        this.sceneManager.resize(width, height);
    },

    getCameraInteraction() {
        return this.app.model.client.getCameraInteraction();
    }
};

export { CoreModule };
