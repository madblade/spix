/**
 * Core methods.
 */

'use strict';

import { sigma } from 'sigma';

var CoreModule = {
    run: function() {
        // Controls are tightly linked to camera.
        this.initializeControls();

        // Init animation.
        this.resize();
        this.animate();

        // Init stats.
        // document.body.appendChild(this.fps.dom);
        this.runSigma();
    },

    runSigma: function() {
        var data = {
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

        var s = new sigma({
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

    animate: function() {
        var clientModel = this.app.model.client;
        var serverModel = this.app.model.server;

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
        //this.render();
        //clientModel.refresh();
    },

    render: function() {
        var sceneManager = this.sceneManager;
        var cameraManager = this.cameraManager;
        var rendererManager = this.rendererManager;
        var portals = this.app.model.server.xModel.portals;

        // Refresh portals.
        this.processPortalUpdates();

        // Refresh camera mouse movements.
        cameraManager.refresh();

        // Perform rendering.
        rendererManager.render(sceneManager, cameraManager, portals);
    },

    stop: function() {
        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
        }
    },

    resize: function() {
        var width = window.innerWidth;
        var height = window.innerHeight;

        // Update aspects.
        this.cameraManager.resize(width, height);

        // Update main renderer.
        this.rendererManager.resize(width, height);

        // Resize render targets.
        this.sceneManager.resize(width, height);
    },

    getCameraInteraction: function() {
        return this.app.model.client.getCameraInteraction();
    }
};

export { CoreModule };
