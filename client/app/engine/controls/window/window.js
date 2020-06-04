/**
 *
 */

'use strict';

// Legacy
let WindowModule = {

    setupWindowListeners()
    {
        let visibilityChange;
        let hidden;

        if (typeof document.hidden !== 'undefined') {
            // Opera 12.10 and Firefox 18 and later support
            hidden = 'hidden';
            visibilityChange = 'visibilitychange';
        } else if (typeof document.msHidden !== 'undefined') {
            hidden = 'msHidden';
            visibilityChange = 'msvisibilitychange';
        } else if (typeof document.webkitHidden !== 'undefined') {
            hidden = 'webkitHidden';
            visibilityChange = 'webkitvisibilitychange';
        } else {
            console.log('Visibility change API not supported!');
            console.log('Rolling back - using Alt-Tab, Ctrl-Tab or the likes may ' +
                'result in focus-state bugs (rejoin to cancel if any).');
            return;
        }

        let handlerVisibilityChange = function()
        {
            if (document[hidden]) {
                if (this.isTouch) this.stopTouchListeners();
                else this.stopKeyboardListeners();
            } else if (!document[hidden]) { // eslint if
                if (this.isTouch) this.stopTouchListeners();
                else this.startKeyboardListeners();
            }
        }.bind(this);

        this.windowListeners = {
            start() {
                document.addEventListener(
                    visibilityChange, handlerVisibilityChange, false
                );
            },
            stop() {
                document.removeEventListener(
                    visibilityChange, handlerVisibilityChange
                );
            }
        };
    },

    startWindowListeners()
    {
        this.windowListeners.start();
    },

    stopWindowListeners()
    {
        this.windowListeners.stop();
    }

};

export { WindowModule };
