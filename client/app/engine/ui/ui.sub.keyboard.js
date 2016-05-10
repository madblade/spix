/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupKeyboard = function() {
    this.keys = {
        forward: 38,
        backwards: 40,
        right: 39,
        left: 37
    };

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
    ++this.tweak;
    this.tweak %= 5;
    if (this.tweak !== 0) return;

    var ak = this.activeKeys;
    var ce = this.app.connectionEngine;

    if (ak.forward !== ak.backwards) {
        if (ak.forward) ce.send('move', 'f');
        else if (ak.backwards) ce.send('move', 'b');
    }

    if (ak.left !== ak.right) {
        if (ak.left) ce.send('move', 'l');
        else if (ak.right) ce.send('move', 'r');
    }
};
