/**
 * User interaction.
 */

'use strict';

App.Engine.UI = function(app) {
    this.app = app;
    this.threeControlsEnabled = false;

    // Keyboard needs a list of possible keystrokes;
    this.keys = {};
    // and a list of keys actually pressed.
    this.activeKeys = {};

    // Other input methods.
    this.mouse = {};
    this.touch = {};
};

App.Engine.UI.prototype.run = function() {
    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();

    $(window).resize(this.app.graphicsEngine.resize.bind(this.app.graphicsEngine));
};

App.Engine.UI.prototype.update = function() {
    this.updateKeyboard();
    this.updateMouse();
};

// TODO later fullscreen
/*if (/Firefox/i.test(navigator.userAgent)) {
 var fullscreenchange = function (event) {
 if (!(document.fullscreenElement === element || document.mozFullscreenElement === element ||
 document.mozFullScreenElement === element)) return;

 document.removeEventListener('fullscreenchange', fullscreenchange);
 document.removeEventListener('mozfullscreenchange', fullscreenchange);
 element.requestPointerLock();
 };

 document.addEventListener('fullscreenchange', fullscreenchange, false);
 document.addEventListener('mozfullscreenchange', fullscreenchange, false);
 element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen ||
 element.mozRequestFullScreen || element.webkitRequestFullscreen;

 element.requestFullscreen();
 } else {
 element.requestPointerLock();
 }*/