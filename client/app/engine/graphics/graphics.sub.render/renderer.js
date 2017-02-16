/**
 * Renderer, render layers management.
 */

'use strict';

App.Engine.Graphics.RendererManager = function() {
    // Cap number of passes.
    this.renderMax = Number.POSITIVE_INFINITY;
    
    this.renderer = this.createRenderer();

    // Lightweight screen, camera and scene manager for portals.
    this.renderRegister = [];
};

extend(App.Engine.Graphics.RendererManager.prototype, {

    createRenderer: function() {
        // Configure renderer
        var renderer = new THREE.WebGLRenderer({
            // TODO [MEDIUM] propose different antialiasing strategy
            //antialias: true,
            alpha: true
        });

        renderer.setClearColor(0x435D74, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        return renderer;
    },

    getRenderRegister: function() {
        return this.renderRegister;  
    },
    
    setRenderRegister: function(renderRegister) {
        this.renderRegister = renderRegister;  
    },

    render: function(sceneManager, cameraManager) {
        var renderer = this.renderer;
        var renderRegister = this.renderRegister;

        // Render first pass.
        var mainScene = sceneManager.mainScene;
        var mainCamera = cameraManager.mainCamera.getRecorder();

        // Render every portal.
        var renderCount = 0;
        var renderMax = this.renderMax;
        
        var currentPass, screen1, screen2, scene, camera;
        var bufferScene, bufferCamera, bufferTexture;
        var otherEnd, otherSceneId;
        for (var i = 0, n = renderRegister.length; i < n; ++i) {
            if (renderCount++ > renderMax) break;
            
            currentPass = renderRegister[i];
            screen1 = currentPass.screen1;
            screen2 = currentPass.screen2;
            camera = currentPass.camera;
            
            bufferScene = currentPass.scene;
            if (!camera) continue;
            bufferCamera = camera.getRecorder();
            bufferTexture = screen1.getRenderTarget();
            
            if (!bufferScene)   { console.log('Could not get buffer scene.'); 
                // Sometimes the x model would be initialized before the w model.
                if (currentPass.sceneId) { currentPass.scene = sceneManager.getScene(currentPass.sceneId); }
                continue;
            }
            if (!bufferCamera)  { console.log('Could not get buffer camera.'); continue; }
            if (!bufferTexture) { console.log('Could not get buffer texture.'); continue; }
            
            if (screen2) {
                otherSceneId = currentPass.sceneId;
                otherEnd = screen2.getMesh();
                sceneManager.removeObject(otherEnd, otherSceneId);
            }
            
            renderer.render(bufferScene, bufferCamera, bufferTexture);
            
            if (screen2) {
                sceneManager.addObject(otherEnd, otherSceneId);
            }
        }

        renderer.render(mainScene, mainCamera);
    },

    resize: function(width, height) {
        if (!width) width = window.innerWidth;
        if (!height) height = window.innerHeight;
        this.renderer.setSize(width, height);
    }

});

/** Interface with graphics engine. **/

extend(App.Engine.Graphics.prototype, {

    createRendererManager: function() {
        return new App.Engine.Graphics.RendererManager();
    }

});
