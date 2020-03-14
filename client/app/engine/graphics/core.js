/**
 * Core methods.
 */

'use strict';

import { sigma } from 'sigma';

let CoreModule = {
    run() {
        // Controls are tightly linked to camera.
        this.initializeControls();

        // Init animation.
        this.resize();
        this.animate();

        // Init stats.
        // document.body.appendChild(this.fps.dom);
        this.runSigma();
    },

    runSigma() {
        let data = {
            nodes: [
                {
                    id: 'n0',
                    label: 'A node',
                    x: 0,
                    y: 0,
                    size: 3
                },
                {
                    id: 'n1',
                    label: 'Another node',
                    x: 3,
                    y: 1,
                    size: 2
                },
                {
                    id: 'n2',
                    label: 'And a last one',
                    x: 1,
                    y: 3,
                    size: 1
                },
                {
                    id: 'n5',
                    label: 'And a last one',
                    x: 4,
                    y: 3,
                    size: 4
                }
            ],
            edges: [
                {
                    id: 'e0',
                    source: 'n0',
                    target: 'n1'
                },
                {
                    id: 'e1',
                    source: 'n1',
                    target: 'n2'
                },
                {
                    id: 'e2',
                    source: 'n2',
                    target: 'n0'
                }
            ]
        };

        let s = new sigma({
            graph: data,
            container: 'network-graph',
            settings: {
                defaultNodeColor: '#ec5148'
                // defaultNodeColor: '#ffffff'
            }
        });

        s.refresh();
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
