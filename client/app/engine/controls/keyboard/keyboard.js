/**
 *
 */

'use strict';

import extend               from '../../../extend.js';
import { ListenerModule }   from './listeners.js';
import { KeysModule }       from './keys.js';
import { LayoutAZERTY }     from './layout.azerty.js';
import { LayoutQWERTY }     from './layout.qwerty.js';
import { LayoutCustom }     from './layout.custom.js';

let KeyboardModule = {

    setupKeyboard()
    {
        // Try to detect user language
        this.settings.language = window.navigator.userLanguage || window.navigator.language || 'en-US';

        this.settings.language = 'en';
        if (navigator.language === 'fr-FR' || navigator.language === 'fr')
            this.settings.language = 'fr';

        // Controls
        this.keyControls = this.getKeyControls(this.settings.language);

        // Tweak for filtering some events...
        // this.tweak = 0;
    },

    startKeyboardListeners()
    {
        if (this.isTouch)
            console.warn('[Keyboard] requested keyboard listeners on a touch device.');

        this.registerKeyDown();
        this.registerKeyUp();
    },

    stopKeyboardListeners()
    {
        this.stopKeyboardInteraction();
        this.unregisterKeyDown();
        this.unregisterKeyUp();
    },

    /**
     * @param newLayout
     *      Layout language (en or fr) to use from now on.
     * @param dontRestartListeners
     *      If the method should keep listeners silent.
     * @param newBinding
     *      Optional. For custom layouts, a new [action, key] binding.
     */
    changeLayout(newLayout, dontRestartListeners, newBinding)
    {
        // Prevent keys from being fired when configuring.
        this.stopKeyboardListeners();

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
    }

};

// Pack module.
extend(KeyboardModule, ListenerModule);
extend(KeyboardModule, KeysModule);
extend(KeyboardModule, LayoutAZERTY);
extend(KeyboardModule, LayoutQWERTY);
extend(KeyboardModule, LayoutCustom);

export { KeyboardModule };
