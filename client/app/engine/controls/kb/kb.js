/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupKeyboard = function() {

    // Try to detect user language
    this.settings.language = window.navigator.userLanguage || window.navigator.language || "en-US";

    // TODO remove this (convenient just for me).
    this.settings.language = "fr";

    // Controls
    this.keyControls = this.getKeyControls(this.settings.language);
    this.activeKeyControls = this.getActiveKeyControls();

    // Tweak for filtering some events...
    this.tweak = 0;
};

App.Engine.UI.prototype.startKeyboardListeners = function() {
    this.registerKeyDown();
    this.registerKeyUp();
};

App.Engine.UI.prototype.stopKeyboardListeners = function() {
    this.stopKeyboardInteraction();
    this.unregisterKeyDown();
    this.unregisterKeyUp();
};

/**
 * @param newLayout
 *      Layout language (en or fr) to use from now on.
 * @param dontRestartListeners
 *      If the method should keep listeners silent.
 * @param newBinding
 *      Optional. For custom layouts, a new [action, key] binding.
 */
App.Engine.UI.prototype.changeLayout = function(newLayout, dontRestartListeners, newBinding) {
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
    if (!dontRestartListeners) this.startKeyboardListeners();
};
