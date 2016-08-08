/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupCustomLayout = function(newBinding) {
    if (!newBinding || newBinding.lenghth !== 2) {
        console.log('Binding ' + newBinding + ' not supported.');
        return;
    }

    var k = this.keyControls;
    var action = newBinding[0];
    var keyCode = newBinding[1];

    if (k.hasOwnProperty(action)) {
        // Determine whether key is already used.
        for (var _action in k) {
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
        console.log('Binding ' + newBinding + ' not supported.');
    }

};
