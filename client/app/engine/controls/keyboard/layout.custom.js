/**
 *
 */

'use strict';

let LayoutCustom = {

    setupCustomLayout(newBinding)
    {
        if (!newBinding || newBinding.length !== 2) {
            console.log(`Binding ${newBinding} not supported.`);
            return;
        }

        let k = this.keyControls;
        let action = newBinding[0];
        let keyCode = newBinding[1];

        if (k.hasOwnProperty(action)) {
            // Determine whether key is already used.
            for (let _action in k) {
                if (_action === action) continue;
                if (k[_action] === keyCode) {
                    // Switch.
                    k[_action] = k[action];
                    k[action] = keyCode;
                    return;
                }
            }

            // New keycode.
            k[action] = keyCode;
        }

        else {
            console.log(`Binding ${newBinding} not supported.`);
        }
    }

};

export { LayoutCustom };
