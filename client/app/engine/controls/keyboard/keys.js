/**
 *
 */

'use strict';

let KeysModule = {

    /**
     * Get key codes (internationalization required).
     * @param layout
     */
    getKeyControls(layout)
    {
        let keyControls;

        switch (layout) {
            case 'en':
            case 'en-US':
            case 'en-GB':
                keyControls = this.getQWERTY();
                break;

            case 'fr':
                keyControls = this.getAZERTY();
                break;

            default:
                console.log('Invalid keyboard layout. Switching to English as default.');
                keyControls = this.getQWERTY();
                return;
        }

        return keyControls;
    }

};

export { KeysModule };
