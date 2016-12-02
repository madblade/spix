/**
 *
 */

'use strict';

/**
 * Keyboard behaviour when a key is pressed.
 */
App.Engine.UI.prototype.registerKeyDown = function() {
    var app = this.app;

    $(window).keydown(function(event) {
        event.preventDefault();
        if (!event.keyCode) { return; }
        if (app.getState() !== 'ingame') return;

        var k = this.keyControls;
        var clientModel = app.model.client;
        var graphics = app.engine.graphics;

        switch (event.keyCode) {
            case k.arrowUp:
            case k.leftHandUp:
                clientModel.triggerEvent('m', 'f');
                break;
            case k.arrowRight:
            case k.leftHandRight:
                clientModel.triggerEvent('m', 'r');
                break;
            case k.arrowLeft:
            case k.leftHandLeft:
                clientModel.triggerEvent('m', 'l');
                break;
            case k.arrowDown:
            case k.leftHandDown:
                clientModel.triggerEvent('m', 'b');
                break;
            case k.shift:
                clientModel.triggerEvent('m', 'd');
                break;
            case k.space:
                clientModel.triggerEvent('m', 'u');
                break;
            case k.f:
                graphics.changeInteraction();
                break;
            case k.g: // Gravity.
                clientModel.triggerEvent('a', 'g');
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
    var clientModel = this.app.model.client;
    clientModel.triggerEvent('m', 'xx');
};

/**
 * Keyboard behaviour when a key is released.
 */
App.Engine.UI.prototype.registerKeyUp = function() {
    var app = this.app;

    $(window).keyup(function(event) {
        event.preventDefault();
        if (!event.keyCode) return;
        if (app.getState() !== 'ingame') return;

        var k = this.keyControls;
        var clientModel = app.model.client;

        switch (event.keyCode) {
            case k.arrowUp:
            case k.leftHandUp:
                clientModel.triggerEvent('m', 'fx');
                break;
            case k.arrowRight:
            case k.leftHandRight:
                clientModel.triggerEvent('m', 'rx');
                break;
            case k.arrowLeft:
            case k.leftHandLeft:
                clientModel.triggerEvent('m', 'lx');
                break;
            case k.arrowDown:
            case k.leftHandDown:
                clientModel.triggerEvent('m', 'bx');
                break;
            case k.shift:
                clientModel.triggerEvent('m', 'dx');
                break;
            case k.space:
                clientModel.triggerEvent('m', 'ux');
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
