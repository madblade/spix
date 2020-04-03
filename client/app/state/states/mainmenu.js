/**
 * Connect to a distant / local server or launch a local server.
 */

'use strict';

import extend from '../../extend';
import { $ } from '../../modules/polyfills/dom.js';

let MainMenuState = function(stateManager) {
    this.stateManager = stateManager;
    this.stateName = 'main';

    this.htmlHead = '<div className="container"">';
    this.htmlDistantServer = `
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
        </div>`;

    this.htmlRemoteSandbox =
        `<hr/>

        <label for="connect-webrtc-server">Connect to a remote sandbox (WebRTC, no AdBlock)</label>
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
        </div>`;

    this.htmlLocalSandbox =
        `<hr/>

        <label for="connect-throttle-server">Connect to my local sandbox</label>
        <div class="input-group mb-3" id="connect-throttle-server">
            <div class="input-group-prepend">
                <span class="input-group-text">@localhost/browser</span>
            </div>
            <div class="input-group-append">
                <button id="button-connect-throttle-server"
                    class="btn btn-light" type="button">Connect</button>
            </div>
        </div>

        <label for="start-sandbox">Invite people into my local sandbox (WebRTC, no AdBlock!)</label>
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
        </div>`;

    this.htmlQuick =
        `<hr/>

        <label for="play-quick">In a hurry? Press the button below.</label>
        <div class="input-group mb-3" id="play-quick">
            <div class="input-group-append">
                <button id="button-play-quick"
                    class="btn btn-light" type="button">I demand to be entertained, at once!</button>
            </div>
        </div>
    `;
    this.htmlTail = '</div>';
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
            .append(this.htmlHead)
            .append(this.htmlDistantServer)
            .append(this.htmlRemoteSandbox)
            .append(this.htmlLocalSandbox)
            .append(this.getRTCUsers())
            .append(this.htmlQuick)
            .append(this.htmlTail)
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

    getRTCUserHTML(userID, offer, answer) {
        if (!offer) offer = '';
        else offer = offer.replace(/\x22/g, '&quot;');
        if (!answer) answer = '';
        else answer = answer.replace(/\x22/g, '&quot;');

        return `
            <div class="input-group mb-3" id="${userID}">
                <div class="input-group-prepend">
                    <span class="input-group-text">@${userID}</span>
                </div>
                <div class="input-group-append">
                    <span class="input-group-text">Offer</span>
                </div>

                <input type="text" id="offer-user-${userID}"
                    class="form-control" placeholder="Offer" value="${offer}">

                <div class="input-group-append">
                    <span class="input-group-text">Answer</span>
                </div>

                <input type="text" id="answer-user-${userID}"
                    class="form-control" placeholder="Answer" value="${answer}">

                <div class="input-group-append">
                    <button id="button-connect-user-${userID}"
                        class="btn btn-light" type="button">Connect User</button>
                </div>
                <div class="input-group-append">
                    <button id="button-disconnect-user-${userID}"
                        class="btn btn-light" type="button">Disconnect User</button>
                </div>
            </div>`;
    },

    getRTCUsers() {
        let localServerModel = this.stateManager.app.model.localServer;
        let users = localServerModel.users;
        let usersHTML = '<div class="list-group" id="user-slots">';
        users.forEach((user, userID) => {
            usersHTML += this.getRTCUserHTML(userID, user.offer, user.answer);
        });
        usersHTML += '</div>';
        return usersHTML;
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
            this.getRTCUserHTML(newUserID)
        );

        localServerModel.addUser(newUserID);
        rtcService.addServerSlot(newUserID, this);

        // TODO add listeners on buttons for new users.
    },

    serverSlotCreated(userID, offer) {
        let offerElement = $(`#offer-user-${userID}`);
        if (!offerElement) {
            console.error(`[States/MainMenu] User "${userID}" HTML element not found.`);
            return;
        }
        offerElement.val(offer);
        let localServerModel = this.stateManager.app.model.localServer;
        localServerModel.setUserOffer(userID, offer);

    },

});

export { MainMenuState };
