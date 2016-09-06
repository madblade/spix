/**
 *
 */

'use strict';

/**
 * Get key codes (internationalization required).
 * @param layout
 */
App.Engine.UI.prototype.getKeyControls = function(layout) {
    var keyControls;

    switch (layout) {
        case 'en':
        case 'en-US':
        case 'en-GB':
            keyControls = this.getQWERTY();
            break;

        case ('fr'):
            keyControls = this.getAZERTY();
            break;

        default:
            console.log('Invalid keyboard layout. Switching to English as default.');
            keyControls = this.getQWERTY();
            return;
    }

    return keyControls;
};

/**
 * Get possible actions (and if corresponding keys are pressed).
 */
App.Engine.UI.prototype.getActiveKeyControls = function() {
    return {
        forward: false,
        backwards: false,
        right: false,
        left: false,
        up: false,
        down: false
    };
};
