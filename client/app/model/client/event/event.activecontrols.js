/**
 *
 */

'use strict';

let ActiveControlsModule = {

    getActiveControls()
    {
        return {
            forward: false,
            backwards: false,
            right: false,
            left: false,
            up: false,
            down: false,
            run: false
        };
    }

};

export { ActiveControlsModule };
