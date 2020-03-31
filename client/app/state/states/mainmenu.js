/**
 * Connect to a distant / local server or launch a local server.
 */

'use strict';

import extend from '../../extend';
import { $ } from '../../modules/polyfills/dom.js';

let MainMenuState = function(stateManager) {
    this.stateManager = stateManager;
    this.stateName = 'main';
    this.html = `
        <div class="container"">
            <label for="connect-socket-server">Connect to real server (Socket)</label>
            <div class="input-group mb-3" id="connect-socket-server">
                <div class="input-group-prepend">
                    <span class="input-group-text">@</span>
                </div>

                <input type="text" class="form-control" placeholder="IP address or host name">

                <div class="input-group-append">
                    <span class="input-group-text">:</span>
                </div>

                <input type="text" class="form-control" placeholder="Port">

                <div class="input-group-append">
                    <button class="btn btn-light" type="button">Connect</button>
                </div>
            </div>

            <label for="connect-socket-server">Connect to remote sandbox (WebRTC, experimental)</label>
            <div class="input-group mb-3" id="connect-socket-server">
                <div class="input-group-prepend">
                    <span class="input-group-text">@</span>
                </div>

                <input type="text" class="form-control" placeholder="Host ID">

                <div class="input-group-append">
                    <button class="btn btn-light" type="button">Connect</button>
                </div>
            </div>

            <label for="connect-socket-server">Connect to local sandbox (experimental)</label>
            <div class="input-group mb-3" id="connect-socket-server">
                <div class="input-group-prepend">
                    <span class="input-group-text">@localhost/browser</span>
                </div>
                <div class="input-group-append">
                    <button class="btn btn-light" type="button">Connect</button>
                </div>
            </div>

            <label for="connect-socket-server">Start local sandbox (VERY experimental)</label>
            <div class="input-group mb-3" id="connect-socket-server">
                <div class="input-group-prepend">
                    <span class="input-group-text">@localhost/powerful-browser</span>
                </div>
                <div class="input-group-append">
                    <button class="btn btn-light" type="button">Start</button>
                </div>
            </div>
        </div>
    `;
};

extend(MainMenuState.prototype, {

    start() {
        console.log('main menu started');
        $('#announce')
            .empty()
            .removeClass()
            .append(this.html)
            .center()
            .show();
    },

    end() {
        $('#announce')
            .empty();
    }

});

export { MainMenuState };
