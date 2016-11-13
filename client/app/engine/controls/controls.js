/**
 * User interaction.
 */

'use strict';

App.Engine.UI = function(app) {
    this.app = app;

    // User customizable settings.
    this.settings = {
        language: ''
    };

    this.threeControlsEnabled = false;

    // Keyboard needs a list of possible keystrokes;
    // and a list of keys actually pressed.
    this.keyControls = {};
    this.activeKeyControls = {};

    // Other input methods.
    this.mouse = {};
    this.touch = {};
};

App.Engine.UI.prototype.run = function() {
    var graphicsEngine = this.app.engine.graphics;

    // TODO detect device (PC, tablet, smartphone, VR <- lol)
    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();

    $(window).resize(graphicsEngine.resize.bind(graphicsEngine));
};

App.Engine.UI.prototype.stopListeners = function() {
    this.stopKeyboardListeners();
    this.stopMouseListeners();
    this.stopTouchListeners();
    $(window).off('resize');
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