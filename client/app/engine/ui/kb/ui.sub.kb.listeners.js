/**
 *
 */

'use strict';

/**
 * Keyboard behaviour when a key is pressed.
 */
App.Engine.UI.prototype.registerKeyDown = function() {
    $(window).keydown(function(event) {
        if (!event.keyCode) { return; }
        var k = this.keyControls;
        var ak = this.activeKeyControls;
        event.preventDefault();

        switch (event.keyCode) {
            case k.arrowUp:
            case k.leftHandUp:
                ak.forward = true;
                break;
            case k.arrowRight:
            case k.leftHandRight:
                ak.right = true;
                break;
            case k.arrowLeft:
            case k.leftHandLeft:
                ak.left = true;
                break;
            case k.arrowDown:
            case k.leftHandDown:
                ak.backwards = true;
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
        var k = this.keyControls;
        var ak = this.activeKeyControls;
        event.preventDefault();

        switch (event.keyCode) {
            case k.arrowUp:
            case k.leftHandUp:
                ak.forward = false;
                break;
            case k.arrowRight:
            case k.leftHandRight:
                ak.right = false;
                break;
            case k.arrowLeft:
            case k.leftHandLeft:
                ak.left = false;
                break;
            case k.arrowDown:
            case k.leftHandDown:
                ak.backwards = false;
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
