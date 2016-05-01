/**
 * Front-end graphics.
 */

'use strict';

// Polyfill for rAF compatibility
(function() {
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    var lastTime = 0;

    if(! ('performance' in window)) {
        window.performance = {};
    }

    if(!Date.now) {
        Date.now = function() { return new Date().getTime(); };
    }

    if (! ('now' in window.performance)) {
        var nowOffset = Date.now();
        if(performance.timing && performance.timing.navigationStart) {
            nowOffset = performance.timing.navigationStart;
        }
        window.performance.now = function() { return (Date.now() - nowOffset); };
    }

    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if(!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            var currTime = Date.now();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {callback(currTime + timeToCall);},
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if(!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

}) ();

App.Engine.Graphics = function(app) {
    this.app = app;

    // Rendering
    this.renderer = this.getRenderer();
    this.scene = this.getScene(); // TODO states
    this.camera = this.getCamera(); // TODO states
    this.requestId = null;

    // Initialize DOM element
    this.container = document.getElementById('container');
    this.container.appendChild(this.renderer.domElement);
};

App.Engine.Graphics.prototype.run = function() {
    // Init animation.
    this.animate();
};

App.Engine.Graphics.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
    console.log('render');
};

App.Engine.Graphics.prototype.animate = function() {
    this.requestId = requestAnimationFrame(this.animate.bind(this));
    this.render();
};

App.Engine.Graphics.prototype.stop = function() {
    if (this.requestId) {
        cancelAnimationFrame(this.requestId);
    }
};

App.Engine.Graphics.prototype.resize = function () {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
};
