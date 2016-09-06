/**
 *
 */

'use strict';

/**
 * Keyboard behaviour when a key is pressed.
 */
App.Engine.UI.prototype.registerKeyDown = function() {
    $(window).keydown(function(event) {
        event.preventDefault();
        if (this.app.stateManager.state !== 'ingame') return;

        if (!event.keyCode) { return; }
        var k = this.keyControls;
        var ak = this.activeKeyControls;
        var ce = this.app.connectionEngine;

        switch (event.keyCode) {
            case k.arrowUp:
            case k.leftHandUp:
                if (!ak.forward) ce.send('m', 'f');
                ak.forward = true;
                break;
            case k.arrowRight:
            case k.leftHandRight:
                if (!ak.right) ce.send('m', 'r');
                ak.right = true;
                break;
            case k.arrowLeft:
            case k.leftHandLeft:
                if (!ak.left) ce.send('m', 'l');
                ak.left = true;
                break;
            case k.arrowDown:
            case k.leftHandDown:
                if (!ak.backwards) ce.send('m', 'b');
                ak.backwards = true;
                break;
            case k.shift:
                if (!ak.down) ce.send('m', 'd');
                ak.down = true;
                break;
            case k.space:
                if (!ak.up) ce.send('m', 'u');
                ak.up = true;
                break;

            case k.enter:
                /*
                    TODO for chat:
                    1. remove keyboard and mouse listeners until the user has finished typing.
                    2. show AOE-like dialog for chat messages
                    3. on validate, send message to server via chat module
                    Maybe a better option: create a new 'chatting' state using stateManager, that takes care of
                    key, mouse (and other like touch) listeners.
                 */
                break;

            default:
                // this.stopKeyboardInteraction();
        }
    }.bind(this));
};

// Manage alt-tab like border effects
App.Engine.UI.prototype.stopKeyboardInteraction = function() {
    var ak = this.activeKeyControls;
    var ce = this.app.connectionEngine;

    ce.send('m', 'xx');
    ak.forward = false;
    ak.backwards = false;
    ak.right = false;
    ak.left = false;
};

/**
 * Keyboard behaviour when a key is released.
 */
App.Engine.UI.prototype.registerKeyUp = function() {
    $(window).keyup(function(event) {
        event.preventDefault();
        if (this.app.stateManager.state !== 'ingame') return;

        if (!event.keyCode) { return; }
        var k = this.keyControls;
        var ak = this.activeKeyControls;
        var ce = this.app.connectionEngine;

        switch (event.keyCode) {
            case k.arrowUp:
            case k.leftHandUp:
                ak.forward = false;
                ce.send('m', 'fx');
                break;
            case k.arrowRight:
            case k.leftHandRight:
                ak.right = false;
                ce.send('m', 'rx');
                break;
            case k.arrowLeft:
            case k.leftHandLeft:
                ak.left = false;
                ce.send('m', 'lx');
                break;
            case k.arrowDown:
            case k.leftHandDown:
                ak.backwards = false;
                ce.send('m', 'bx');
                break;
            case k.shift:
                ak.down = false;
                ce.send('m', 'dx');
                break;
            case k.space:
                ak.up = false;
                ce.send('m', 'ux');
                break;
            default:
        }
    }.bind(this));
};

App.Engine.UI.prototype.unregisterKeyDown = function() {
    $(window).off('keydown');
};

App.Engine.UI.prototype.unregisterKeyUp = function() {
    $(window).off('keyup');
};
