/**
 * List, join, request game creation in a given server.
 */

'use strict';

import extend               from '../../extend.js';
import { $ }                from '../../modules/polyfills/dom.js';

let HubState = function(stateManager) {
    this.stateManager = stateManager;
    this.stateName = 'hub';
    this.htmlControls = `
        <div>
            <button class="btn btn-default hub-button" id="button-return-main" style="float:none">
                Return</button>
        </div>
        <div>
            <button class="btn btn-default hub-button" id="button-create-game" style="float:none">
                New World: Cube</button>
        </div>
        <div>
            <button class="btn btn-default hub-button" style="float:none">
                New World: Hills and Dales</button>
        </div>
        <div>
            <button class="btn btn-default hub-button" style="float:none">
                New World: Unstructured</button>
        </div>
        <div>
            <button class="btn btn-default hub-button" style="float:none">
                New World: Demo</button>
        </div>
      `;
};

extend(HubState.prototype, {

    getHTML(map) {
        let content = '';

        content += `
            ${this.htmlControls}
            <table class="table table-bordered noselect"
            style="width:100%">`;

        console.log(map);
        map.forEach(function(value, key) {
            for (let id = 0; id < value.length; ++id) {
                content +=
                    `<tr>
                        <td>${key}</td>
                        <td>${value[id]}</td>
                    </tr>`;
            }
        });
        content += '</table>';
        return content;
    },

    startListeners() {
        let app = this.stateManager.app;

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

        $('#button-create-game').click(function() {
            app.requestGameCreation('game3d');
        });

        $('#button-return-main').click(function() {
            // Disconnect from WebRTC socket
            app.engine.connection.disconnect();
            app.setState('main');
        });
    },

    start(map) {
        // Add content then fade in.
        let hub = $('#announce');
        hub.empty()
            .removeClass()
            .addClass('hub')
            .append(this.getHTML(map))
            .center()
            .fadeIn();

        // Add listeners.
        this.startListeners();
    },

    stopListeners() {
        $('tr').off('click');
        $('#button-create-game').off('click');
        $('#button-return-main').off('click');
    },

    end() {
        // Remove jQuery listeners.
        this.stopListeners();

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
