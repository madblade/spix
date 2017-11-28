/**
 *
 */

'use strict';

var ActiveControlsModule = {

    getActiveControls: function() {
        return {
            forward: false,
            backwards: false,
            right: false,
            left: false,
            up: false,
            down: false
        };
    }

};

export { ActiveControlsModule };
