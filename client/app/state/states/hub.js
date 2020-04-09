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
    <div class="container">

        <hr />

        <!-- Cube world -->
<!--        <label for="button-create-cube-game">Cube Worlds</label>-->
        <div class="input-group">
            <div class="input-group-prepend mb-1 flex-fill">
                <span class="input-group-text flex-fill">Cube World</span>
            </div>
            <select id="cube-game-hills" class="form-control">
                <option value="0" selected>No Hills</option>
                <option value="1">Moderate Hills</option>
            </select>

            <div class="input-group-append mb-1">
                <span class="input-group-text">Cube size</span>
            </div>
            <input class="form-control" type="number" value="1" min="1" id="cube-game-side-size">

            <div class="input-group-append mb-1">
                <button class="btn btn-outline-light" id="button-create-cube-game">
                    <!-- style="float:none"> -->
                    Create
                </button>
            </div>
        </div>

<!--        <hr />-->

        <!-- Flat world -->
<!--        <label for="button-create-flat-game">Flat World: Hills and Dales</label>-->
        <div class="input-group">
            <div class="input-group-prepend mb-1 flex-fill">
                <span class="input-group-text flex-fill">Flat World</span>
            </div>

            <select id="flat-game-caves-type" class="form-control">
                <option value="0" selected>No Caves</option>
                <option value="1">Subsurface Caves</option>
            </select>

            <select id="flat-game-hills-size" class="form-control">
                <option value="0" selected>No Hills</option>
                <option value="1">Regular Hills</option>
                <option value="2">Giant Hills</option>
                <option value="3">Eroded formations and Arches</option>
                <option value="4">Spikes</option>
            </select>

            <div class="input-group-append mb-1">
                <button class="btn btn-outline-light" id="button-create-flat-game" style="float:none">
                    Create
                </button>
            </div>
        </div>

<!--        <hr /> -->

        <!-- Unstructured world -->
        <!-- TODO triangulation model, graphics, update and netcode -->
        <!-- <label for="button-create-unstructured-game">New World: Unstructured</label> -->
        <!-- <form class="form-inline"> -->
        <!--     <button class="btn btn-default hub-button" id="button-create-unstructured-game" style="float:none"> -->
        <!--         Create</button> -->
        <!-- </form> -->

        <!-- Load world -->
<!--        <label for="button-load-game">Import World (coming soon)</label>-->

<!--        <hr />-->

        <!-- Demo / Tutorial -->
<!--        <label for="button-create-demo-game">New World: Demo / Tutorial</label>-->
        <div class="input-group">
            <div class="input-group-prepend mb-1 flex-fill">
                <span class="input-group-text flex-fill">Demo / Tutorial</span>
            </div>
            <div class="input-group-append mb-1">
                <button class="btn btn-outline-light"
                    id="button-create-demo-game" style="float:none">
                    Create
                </button>
            </div>
        </div>

        <!-- TODO save and import functions server-wise -->
        <div class="input-group">
            <div class="input-group-prepend mb-1 flex-fill">
                <span class="input-group-text flex-fill">Import World (coming soon)</span>
            </div>

            <input type="text" class="form-control" id="load-game-path"
                value="" placeholder="File Path" disabled>

            <div class="input-group-append mb-1">
                <button class="btn btn-outline-light"
                    id="button-load-game" style="float:none" disabled>
                    Import
                </button>
            </div>
        </div>

        <hr />

        <div class="input-group">
            <button class="btn btn-outline-light btn-block" id="button-return-main">
                Back
            </button>
        </div>
    </div>
      `;
};

extend(HubState.prototype, {

    getHTML(map) {
        let content = '';

        content += `
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
        content += `</table>${this.htmlControls}`;
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
