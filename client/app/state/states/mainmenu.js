/**
 * Connect to a distant server or launch a local server.
 */

'use strict';

import extend from '../../extend';
import { $ } from '../../modules/polyfills/dom.js';

let MainMenuState = function(stateManager) {
    this.stateManager = stateManager;
};

extend(MainMenuState.prototype, {

    start() {

    },

    end() {

    }

});

export { MainMenuState };
