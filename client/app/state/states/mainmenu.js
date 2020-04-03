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
            <label for="connect-socket-server">Connect to a distant server (Socket)</label>
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

            <hr/>

            <label for="connect-webrtc-server">Connect to a remote sandbox (WebRTC, experimental)</label>
            <div class="input-group mb-3" id="connect-webrtc-server">
                <div class="input-group-prepend">
                    <span class="input-group-text">Offer</span>
                </div>

                <input type="text" id="remote-client-id"
                    class="form-control" placeholder="Offer text">

                <div class="input-group-prepend">
                    <span class="input-group-text">Answer</span>
                </div>

                <input type="text" id="remote-client-id"
                    class="form-control" placeholder="Answer text">

                <div class="input-group-append">
                    <button id="button-connect-webrtc-server"
                        class="btn btn-light" type="button">Generate Answer</button>
                </div>
            </div>

            <hr/>

            <label for="connect-throttle-server">Connect to my local sandbox (experimental)</label>
            <div class="input-group mb-3" id="connect-throttle-server">
                <div class="input-group-prepend">
                    <span class="input-group-text">@localhost/browser</span>
                </div>
                <div class="input-group-append">
                    <button id="button-connect-throttle-server"
                        class="btn btn-light" type="button">Connect</button>
                </div>
            </div>

            <label for="start-sandbox">Invite people into my local sandbox (experimental)</label>
            <div class="input-group mb-3" id="add-sandbox">
                <div class="input-group-prepend">
                    <span class="input-group-text">@friend</span>
                </div>
                <input type="text" id="new-user-id" pattern="^[a-zA-Z]+$"
                    class="form-control" placeholder="Player ID (no space, no accents, only letters)">
                <div class="input-group-append">
                    <button id="button-add-sandbox"
                        class="btn btn-light" type="button">Add player slot</button>
                </div>
            </div>
            <div class="list-group" id="user-slots">
            </div>

            <hr/>

            <label for="play-quick">In a hurry? Press the button below.</label>
            <div class="input-group mb-3" id="play-quick">
                <div class="input-group-append">
                    <button id="button-play-quick"
                        class="btn btn-light" type="button">I demand to be entertained, at once!</button>
                </div>
            </div>
        </div>
    `;
};

extend(MainMenuState.prototype, {

    startListeners() {
        $('#button-connect-socket-server').click(() => {
            let host = $('#remote-server-address').val();
            let port = $('#remote-server-port').val();
            // TODO manage answer and errors
            if (!host) host = '';
            if (!port || isNaN(port)) port = 8000;

            console.log('con sock');
            this.stateManager.app.startFromRemoteServer(host, port);
        });

        $('#button-connect-webrtc-server').click(() => {
            let id = $('#remote-client-id').val();
            console.log('con webrtc');
        });

        $('#button-connect-throttle-server').click(() => {
            console.log('con throttle');
        });

        $('#button-add-sandbox').click(() => {
            console.log('add webrtc slot');
            this.addUserSlot();
        });

        $('#button-play-quick').click(() => {
            console.log('play quick');
            this.stateManager.app.startFromLocalServer();
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
        $('#button-add-sandbox').off('click');
        $('#button-play-quick').off('click');
    },

    end() {
        this.stopListeners();

        return new Promise(function(resolve) {
            $('#announce')
                .empty();
            resolve();
        });
    },

    addUserSlot() {
        let newUserID = $('#new-user-id').val();
        console.log(newUserID);
        let userSlotsHTML = $('#user-slots');

        $('#user-id-conflict').remove();
        if (newUserID.length < 1) {
            console.error('[States/MainMenu] User ID must not be empty.');
            userSlotsHTML.append(
                `<div class="alert alert-danger"
                    id="user-id-conflict">Please specify a Player ID (name)</div>`
            );
            return;
        }

        let localServerModel = this.stateManager.app.model.localServer;
        let rtcService = this.stateManager.app.engine.connection.rtc;

        if (localServerModel.hasUser(newUserID)) {
            console.error('[States/MainMenu] User ID already used.');
            userSlotsHTML.append(
                `<div class="alert alert-danger"
                    id="user-id-conflict">Player ID already taken</div>`
            );
            return;
        }

        userSlotsHTML.append(
            `<div class="input-group mb-3" id="${newUserID}">
                <div class="input-group-prepend">
                    <span class="input-group-text">@${newUserID}</span>
                </div>
                <div class="input-group-append">
                    <span class="input-group-text">Offer</span>
                </div>

                <input type="text" id="offer-user-${newUserID}"
                    class="form-control" placeholder="Offer">

                <div class="input-group-append">
                    <span class="input-group-text">Answer</span>
                </div>

                <input type="text" id="answer-user-${newUserID}"
                    class="form-control" placeholder="Answer">

                <div class="input-group-append">
                    <button id="button-connect-user-${newUserID}"
                        class="btn btn-light" type="button">Connect User</button>
                </div>
            </div>`);

        localServerModel.addUser(newUserID);
        rtcService.addServerSlot(newUserID);

        // TODO add listeners on buttons for new users.
    }

});

export { MainMenuState };
