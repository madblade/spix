/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupKeyboard = function() {
    this.keys = {};

    this.reconfigure('en'); // TODO detect languages.

    this.activeKeys = {
        forward: false,
        backwards: false,
        right: false,
        left: false
    };

    this.registerKeyDown();
    this.registerKeyUp();

    // Tweak for filtering some events...
    this.tweak = 0;
};

/**
 * @param layout
 *  language (en or fr) or set of strokes
 */
App.Engine.UI.prototype.reconfigure = function(layout) {
    if (layout === 'fr') this.setupFR();
    else if (layout === 'en') this.setupEN();
    else this.setupCustom(layout);
};

/**
 * Keyboard behaviour when a key is pressed.
 */
App.Engine.UI.prototype.registerKeyDown = function() {
    $(window).keydown(function(event) {
        if (!event.keyCode) { return; }
        var k = this.keys;
        var ak = this.activeKeys;
        event.preventDefault();

        switch (event.keyCode) {
            case k.forward: ak.forward = true;
                break;
            case k.right: ak.right = true;
                break;
            case k.left: ak.left = true;
                break;
            case k.backwards: ak.backwards = true;
                break;
            default:
        }
    }.bind(this));
};

/**
 * Keyboard behaviour when a key is released.
 */
App.Engine.UI.prototype.registerKeyUp = function() {
    $(window).keyup(function(event) {
        if (!event.keyCode) { return; }
        var k = this.keys;
        var ak = this.activeKeys;
        event.preventDefault();

        switch (event.keyCode) {
            case k.forward: ak.forward = false;
                break;
            case k.right: ak.right = false;
                break;
            case k.left: ak.left = false;
                break;
            case k.backwards: ak.backwards = false;
                break;
            default:
        }
    }.bind(this));
};

App.Engine.UI.prototype.updateKeyboard = function() {
    var ak = this.activeKeys;
    var ce = this.app.connectionEngine;

    if (ak.forward !== ak.backwards) {
        if (ak.forward) ce.send('m', 'f');
        else if (ak.backwards) ce.send('m', 'b');
    }

    if (ak.left !== ak.right) {
        if (ak.left) ce.send('m', 'l');
        else if (ak.right) ce.send('m', 'r');
    }
};
