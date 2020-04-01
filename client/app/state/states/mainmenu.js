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

                <input type="text" id="remote-server-address"
                    class="form-control" placeholder="IP address or host name">

                <div class="input-group-append">
                    <span class="input-group-text">:</span>
                </div>

                <input type="text" id="remote-server-port"
                    class="form-control" placeholder="Port">

                <div class="input-group-append">
                    <button id="button-connect-socket-server"
                        class="btn btn-light" type="button">Connect</button>
                </div>
            </div>

            <label for="connect-webrtc-server">Connect to remote sandbox (WebRTC, experimental)</label>
            <div class="input-group mb-3" id="connect-webrtc-server">
                <div class="input-group-prepend">
                    <span class="input-group-text">@</span>
                </div>

                <input type="text" id="remote-client-id"
                    class="form-control" placeholder="Host ID">

                <div class="input-group-append">
                    <button id="button-connect-webrtc-server"
                        class="btn btn-light" type="button">Connect</button>
                </div>
            </div>

            <label for="connect-throttle-server">Connect to local sandbox (experimental)</label>
            <div class="input-group mb-3" id="connect-throttle-server">
                <div class="input-group-prepend">
                    <span class="input-group-text">@localhost/browser</span>
                </div>
                <div class="input-group-append">
                    <button id="button-connect-throttle-server"
                        class="btn btn-light" type="button">Connect</button>
                </div>
            </div>

            <label for="start-sandbox">Local sandbox (VERY experimental)</label>
            <div class="input-group mb-3" id="start-sandbox">
                <div class="input-group-prepend">
                    <span class="input-group-text">@localhost/powerful-browser</span>
                </div>
                <div class="input-group-append">
                    <button id="button-start-sandbox"
                        class="btn btn-light" type="button">Add player slot</button>
                </div>
            </div>
        </div>
    `;
};

extend(MainMenuState.prototype, {

    startListeners() {
        $('#button-connect-socket-server').click(() => {
            let host = $('#remote-server-address').text();
            let port = $('#remote-server-port').text();
            // TODO manage answer and errors
            if (!host) host = '';
            if (!port || isNaN(port)) port = 8000;

            console.log('con sock');
            this.stateManager.app.startFromRemoteServer(host, port);
        });

        $('#button-connect-webrtc-server').click(() => {
            let id = $('#remote-client-id').text();
            console.log('con webrtc');
        });

        $('#button-connect-throttle-server').click(() => {
            console.log('con throttle');
        });

        $('#button-start-sandbox').click(() => {
            console.log('start socket');
        });
    },

    start() {
        console.log('main menu started');
        $('#announce')
            .empty()
            .removeClass()
            .append(this.html)
            .center()
            .show();

        this.startListeners();
    },

    stopListeners() {
        $('#button-connect-socket-server').off('click');
        $('#button-connect-webrtc-server').off('click');
        $('#button-connect-throttle-server').off('click');
        $('#button-start-sandbox').off('click');
    },

    end() {
        this.stopListeners();

        return new Promise(function(resolve) {
            $('#announce')
                .empty();
            resolve();
        });
    }

});

export { MainMenuState };
