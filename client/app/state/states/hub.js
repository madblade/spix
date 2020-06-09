/**
 * List, join, request game creation in a given server.
 */

'use strict';

import extend               from '../../extend.js';
import { $ }                from '../../modules/polyfills/dom.js';

let HubState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'hub';

    this.htmlHead = `
    <div class="container">
        <div class="container small-title">
            <h2>spix RC-0.1</h2>
        </div>
    `;

    this.htmlControls = `
    <div class="container">

        <hr />

        <!-- Cube world -->
        <div class="input-group">
            <div class="input-group-prepend mb-1">
                <span class="input-group-text">Cube World</span>
            </div>
            <select id="cube-game-hills" class="form-control">
                <option value="1" selected>Moderate Hills</option>
                <option value="0">No Hills</option>
            </select>

            <div class="input-group-append mb-1">
                <span class="input-group-text">Cube size</span>
            </div>
            <input class="form-control" type="number"
                value="2" min="1" max="256" id="cube-game-side-size">

            <div class="input-group-append mb-1">
                <button class="btn btn-outline-light" id="button-create-cube-game">
                    <!-- style="float:none"> -->
                    Create
                </button>
            </div>
        </div>

        <!-- Flat world -->
        <div class="input-group">
            <div class="input-group-prepend mb-1 flex-fill">
                <span class="input-group-text flex-fill">Flat World</span>
            </div>

            <select id="flat-game-trees-type" class="form-control">
                <option value="0" selected>No trees</option>
                <option value="1">Some trees</option>
            </select>

            <select id="flat-game-hills-size" class="form-control">
                <option value="1" selected>Regular Hills</option>
                <option value="0">No Hills</option>
                <option value="2">Giant Hills</option>
                <!-- <option value="3">Eroded formations and Arches</option>-->
                <!-- <option value="4">Spikes</option>-->
            </select>

            <div class="input-group-append mb-1">
                <button class="btn btn-outline-light" id="button-create-flat-game" style="float:none">
                    Create
                </button>
            </div>
        </div>
        
        <div class="input-group">
            <div class="input-group-prepend mb-1 flex-fill">
                <span class="input-group-text flex-fill">Fantasy World</span>
            </div>

            <div class="input-group-append mb-1">
                <button class="btn btn-outline-light" id="button-create-fantasy-game" style="float:none">
                    Create
                </button>
            </div>
        </div>

        <!-- Unstructured world -->
        <!-- Here goes a triangulation model, graphics, update and netcode -->
        <!-- <div class="input-group">-->
        <!--     <div class="input-group-prepend mb-1 flex-fill">-->
        <!--         <span class="input-group-text flex-fill">Unstructured / Simplex World</span>-->
        <!--     </div>-->
        <!--     <div class="input-group-append mb-1">-->
        <!--         <button class="btn btn-outline-light"-->
        <!--             id="button-create-unstructured-game" style="float:none">-->
        <!--             Create-->
        <!--         </button>-->
        <!--     </div>-->
        <!-- </div>-->

        <!-- Demo / Tutorial -->
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

        <!-- Load world -->
        <!-- Here goes save and import functions server-wise -->
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

    getCommandsHTML()
    {
        return this.htmlControls;
    },

    getInstancesHTMLContainer(map)
    {
        return `
            <div class="container" id="game-instances-table">
                ${this.getInstancesHTMLTable(map)}
            </div>
        `;
    },

    getInstancesHTMLTable(map)
    {
        let content = `
            <table class="table table-bordered noselect"
            style="width:100%">`;

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

    // Consider using this for faster hub state update.
    updateInstances(newMap)
    {
        this.stopTableListeners();
        let container = $('#game-instances-table');
        container.html(this.getInstancesHTMLTable(newMap));
        this.startTableListeners();
    },

    start(map)
    {
        // Add content then fade in.
        let hub = $('#announce');
        hub.empty()
            .removeClass()
            .addClass('hub')
            .append(
                this.htmlHead +
                this.getInstancesHTMLContainer(map) +
                this.getCommandsHTML()
            )
            .css('position', '')
            .fadeIn();

        // Add listeners.
        this.startListeners();
    },

    startTableListeners()
    {
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
    },

    startListeners()
    {
        let app = this.stateManager.app;

        this.startTableListeners();

        $('#button-create-cube-game').click(function() {
            let size = $('#cube-game-side-size').val();
            let hills = $('#cube-game-hills')
                .children('option:selected')
                .val();
            app.requestGameCreation('cube', {size, hills});
        });

        $('#button-create-fantasy-game').click(function() {
            app.requestGameCreation('fantasy', {});
        });

        $('#button-create-flat-game').click(function() {
            let hills = $('#flat-game-hills-size')
                .children('option:selected')
                .val();
            let trees = $('#flat-game-trees-type')
                .children('option:selected')
                .val();
            app.requestGameCreation('flat', { trees, hills });
        });

        $('#button-create-demo-game').click(function() {
            app.requestGameCreation('demo');
        });

        $('#button-return-main').click(function() {
            // Necessary to disconnect from WebRTC socket
            // (among, possibly, other things).
            app.engine.connection.disconnect();
            app.setState('main');
        });

        // XXX To implement: saving / loading
        // $('#button-load-game').click(function() {
        // load-game-path
        // });

        // XXX To implement: unstructured game
        // $('#button-create-unstructured-game').click(function() {});
    },

    stopTableListeners()
    {
        $('tr').off('click');
    },

    stopListeners()
    {
        this.stopTableListeners();
        $('#button-create-cube-game').off('click');
        $('#button-create-fantasy-game').off('click');
        $('#button-create-flat-game').off('click');
        $('#button-create-demo-game').off('click');
        $('#button-return-main').off('click');
    },

    end()
    {
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
