/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupKeyboard = function() {

    // Try to detect user language
    this.settings.language = window.navigator.userLanguage || window.navigator.language || "en-US";

    // Controls
    this.keyControls = this.getKeyControls(this.settings.language);
    this.activeKeyControls = this.getActiveKeyControls();

    this.startKeyboardListeners();

    // Tweak for filtering some events...
    this.tweak = 0;
};

App.Engine.UI.prototype.startKeyboardListeners = function() {
    this.registerKeyDown();
    this.registerKeyUp();
};

App.Engine.UI.prototype.stopKeyboardListeners = function() {
    this.unregisterKeyDown();
    this.unregisterKeyUp();
};

/**
 * @param newLayout
 *      Layout language (en or fr) to use from now on.
 * @param newBinding
 *      Optional. For custom layouts, a new [action, key] binding.
 */
App.Engine.UI.prototype.changeLayout = function(newLayout, newBinding) {
    // Prevent keys from being fired when configuring.
    this.stopKeyboardListeners();

    this.activeKeyControls = this.getActiveKeyControls();

    switch (newLayout) {
        case 'fr':
        case 'en':
        case 'en-US':
        case 'en-GB':
            this.keyControls = this.getKeyControls(newLayout);
            break;
        case 'custom':
        default:
            this.setupCustomLayout(newBinding);
    }

    // Restore event listeners.
    this.startKeyboardListeners();
};


App.Engine.UI.prototype.updateKeyboard = function() {
    var ak = this.activeKeyControls;
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
