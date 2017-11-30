/**
 *
 */

'use strict';

import extend               from '../../extend.js';
import { $ }                from '../../modules/polyfills/dom.js';

let LoadingState = function(stateManager) {
    this.stateManager = stateManager;
    this.stateName = 'loading';
};

extend(LoadingState.prototype, {

    start() {
        $('#announce')
            .append('<div style="" class="title noselect">' +
                '<p>spix<br/>engineering version</p>' +
                '</div>')
            .append('<div id="cube" class="sk-folding-cube">' +
                '<div class="sk-cube1 sk-cube"></div>' +
                '<div class="sk-cube2 sk-cube"></div>' +
                '<div class="sk-cube4 sk-cube"></div>' +
                '<div class="sk-cube3 sk-cube"></div>' +
                '</div>')
            .center();
    },

    end() {
        return new Promise(function(resolve) {
            var loader = $('#announce');
            loader.fadeOut(200, function() {
                loader.empty().removeClass('sk-folding-cube');
                resolve();
            });
        });
    }

});

export { LoadingState };