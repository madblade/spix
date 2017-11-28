/**
 *
 */

'use strict';

import extend               from '../../extend.js';
import { $ }                from '../../modules/polyfills/dom.js';

let HubState = function(stateManager) {
    this.stateManager = stateManager;
    this.stateName = 'hub';
};

extend(HubState.prototype, {

    start(map) {
        let app = this.app;
        let content = '';

        content +=
            '<table ' +
            'class="table table-bordered" ' +
            'style="width:100%" ' +
            'class="noselect">';

        map.forEach(function(value, key) {
            for (let id = 0; id < value.length; ++id) {
                content +=
                    '<tr>' +
                        `<td>${key}</td>` +
                        `<td>${value[id]}</td>` +
                    '</tr>';
            }
        });

        content += '</table>';
        content += '<div><button class="btn btn-default game-creator" style="float:none">' +
            'Request 3D game creation</button></div>';

        // Add content then fade in.
        let hub = $('#announce');
        hub.empty()
            .removeClass()
            .addClass('hub')
            .append(content)
            .center()
            .fadeIn();

        // Add listeners.
        $('tr').click(function() {
            let gameType = $(this).find('td:first')
                .text();
            let gid = $(this).find('td:last')
                .text();

            // Send a connection request.
            if (gameType === '' || gid === '') {
                console.log('Invalid data.');
                return;
            }

            app.join(gameType, gid);
        });

        $('.game-creator').click(function() {
            app.requestGameCreation('game3d');
        });
    },

    end() {
        // Remove jQuery listeners.
        $('tr').off('click');
        $('.game-creator').off('click');

        // Fade out hub announce.
        return new Promise(function(resolve) {
            let hub = $('#announce');
            hub.fadeOut(200, function() {
                hub.empty().removeClass('hub');
                resolve();
            });
        });
    }

});

export { HubState };
