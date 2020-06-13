/**
 *
 */

'use strict';

import { $ } from '../../modules/polyfills/dom';

import extend from '../../extend.js';

let PreIngameState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'preingame';
    this.html = `
        <table class="table table-bordered noselect" style="width:100%">
            <tr id="request-pl"><td>Click to play</td></tr>
        </table>
    `;
};

extend(PreIngameState.prototype, {

    start()
    {
        $('#announce')
            .empty()
            .removeClass()
            .addClass('settings')
            .append(this.html)
            .center()
            .fadeIn();

        $('#request-pl').click(() => {
            this.stateManager.setState('ingame');
            this.stateManager.app.engine.controls.requestLock();
            this.stateManager.app.setFocused(true);
        });
    },

    end()
    {
        $('#request-pl').off('click');
        return new Promise(function(resolve) {
            let requestTab = $('#announce');
            requestTab.fadeOut(200, function() {
                requestTab.empty().removeClass('settings');
                resolve();
            });
        });
    }

});

export { PreIngameState };
