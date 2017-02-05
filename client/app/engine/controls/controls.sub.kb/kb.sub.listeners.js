/**
 *
 */

'use strict';

extend(App.Engine.UI.prototype, {
    /**
     * Keyboard behaviour when a key is pressed.
     */
    registerKeyDown: function() {
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
                case k.leftHandEast2: // F
                    clientModel.triggerChange('camera', 'toggle');
                    break;
                case k.leftHandNorthEast2: // R
                    clientModel.triggerChange('interaction', 'toggle');
                    break;
                case k.leftHandEast3: // (G)ravity.
                    clientModel.triggerEvent('a', 'g');
                    break;

                case k.leftHandNorthWest: // A
                    // TODO debug here
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
    },

    // Manage alt-tab like border effects
    stopKeyboardInteraction: function() {
        var clientModel = this.app.model.client;
        clientModel.triggerEvent('m', 'xx');
    },

    /**
     * Keyboard behaviour when a key is released.
     */
    registerKeyUp: function() {
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
    },

    unregisterKeyDown: function() {
        $(window).off('keydown');
    },

    unregisterKeyUp: function() {
        $(window).off('keyup');
    }

});
