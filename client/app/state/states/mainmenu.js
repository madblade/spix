/**
 * Connect to a distant / local server or launch a local server.
 */

'use strict';

import extend from '../../extend';
import { $ } from '../../modules/polyfills/dom.js';

let MainMenuState = function(stateManager)
{
    this.stateManager = stateManager;
    this.stateName = 'main';

    this.htmlHead = `
        <div class="container">
            <div class="container small-title">
                <h2>spix RC-0.1</h2>
            </div>
        `;
    this.htmlDistantServer = `
        <div class="row col-12"><div class="col-12">
        <hr />

        <label for="connect-socket-server">Connect to a distant server (Socket)</label>
        <div class="input-group" id="connect-socket-server">
            <div class="input-group-prepend">
                <span class="input-group-text">@</span>
            </div>

            <input type="text" id="remote-server-address"
                class="form-control" placeholder="IP address or host name">

            <div class="input-group-prepend" style="margin-left: -1px;">
                <span class="input-group-text">:</span>
            </div>

            <input type="text" id="remote-server-port"
                class="form-control" placeholder="Port">

            <div class="input-group-append">
                <button id="button-connect-socket-server"
                    class="btn btn-outline-light" type="button">Connect</button>
            </div>
        </div>

        </div></div>
        `;

    this.htmlRemoteSandbox =
        `
        <div class="row col-12 d-none d-sm-block"><div class="col-12">
        <hr />

        <label for="connect-webrtc-server">Connect to a remote sandbox (WebRTC, might be <em>uBlock</em>ed!)</label>
        <div class="input-group mb-1" id="connect-webrtc-server">
            <div class="input-group-prepend">
                <span class="input-group-text">Offer</span>
            </div>

            <input type="text" id="remote-client-offer"
                class="form-control" placeholder="Offer text" value="">

            <div class="input-group-prepend" style="margin-left: -1px;">
                <span class="input-group-text">Answer</span>
            </div>

            <input type="text" id="remote-client-answer"
                class="form-control" placeholder="Answer text" value="">

            <div class="input-group-append">
                <button id="button-connect-webrtc-server"
                    class="btn btn-outline-light" type="button">Generate Answer</button>
            </div>
        </div>
        <div class="list-group" id="error-remote-sandbox"></div>

        </div></div>
        `;

    this.htmlLocalSandbox =
        `
        <div class="row col-12 d-none d-sm-block"><div class="col-12">
        <hr />
        <label for="connect-throttle-server">Connect to my local sandbox (this very browser)</label>
        <div class="input-group mb-3" id="connect-throttle-server">
            <div class="input-group-prepend flex-fill">
                <span class="input-group-text flex-fill">@localhost/browser</span>
            </div>
            <div class="input-group-append">
                <button id="button-connect-throttle-server"
                    class="btn btn-outline-light" type="button">Connect</button>
            </div>
        </div>
        </div></div>

        <div class="row col-12 d-none d-sm-block"><div class="col-12">
        <label for="start-sandbox">Invite people into my local sandbox (WebRTC, might be <em>uBlock</em>ed!)</label>
        <div class="input-group mb-1" id="add-sandbox">
            <div class="input-group-prepend">
                <span class="input-group-text">@friend</span>
            </div>
            <input type="text" id="new-user-id" pattern="^[a-zA-Z]+$"
                class="form-control" placeholder="Player ID (no space, no accents, only letters)">
            <div class="input-group-append">
                <button id="button-add-sandbox"
                    class="btn btn-outline-light" type="button">Add player slot</button>
            </div>
        </div>
        </div></div>
        `;

    this.htmlQuick =
        `
        <div class="row col-12"><div class="col-12">

        <label for="play-quick">Solo mode</label>
        <div class="input-group mb-1 center-block" id="play-quick">

            <div class="d-none d-sm-block input-group-prepend flex-fill">
                <span class="input-group-text flex-fill">No time to set up a server?</span>
            </div>
            <div class="input-group-append">
                <button id="button-play-quick"
                    class="btn btn-outline-light" type="button">I want to play at once; make it so!</button>
            </div>

        </div>

        </div></div>
        `;
    this.htmlTail = '</div>';
};

extend(MainMenuState.prototype, {

    startListeners()
    {
        $('#button-connect-socket-server').click(() => {
            let host = $('#remote-server-address').val();
            let port = $('#remote-server-port').val();
            if (!host) host = '';
            if (!port || isNaN(port)) port = 8000;
            // XXX [PROD] wire production port
            this.stateManager.app.startFromRemoteServer(host, port);
        });

        $('#button-connect-webrtc-server').click(() => {
            this.generateClientAnswer();
        });

        $('#button-connect-throttle-server').click(() => {
            this.stateManager.app.startFromLocalServer();
        });

        $('#button-add-sandbox').click(() => {
            this.addUserSlot();
        });

        $('#button-play-quick').click(() => {
            this.stateManager.app.startDemo();
        });

        this.listenRTCUsers();
    },

    start()
    {
        $('#announce').empty()
            .removeClass()
            .addClass('main-menu')
            .append(
                this.htmlHead +
                this.htmlQuick +
                this.htmlDistantServer +
                this.htmlRemoteSandbox +
                this.htmlLocalSandbox +
                this.getRTCUsers() +
                this.htmlTail
            )
            .css('position', '')
            .show();

        this.startListeners();
    },

    stopListeners()
    {
        $('#button-connect-socket-server').off('click');
        $('#button-connect-webrtc-server').off('click');
        $('#button-connect-throttle-server').off('click');
        $('#button-add-sandbox').off('click');
        $('#button-play-quick').off('click');
    },

    end()
    {
        this.stopListeners();

        return new Promise(function(resolve) {
            $('#announce')
                .empty();
            resolve();
        });
    },

    // ######### RTC CLIENT METHODS #########

    generateClientAnswer()
    {
        let rtcService = this.stateManager.app.engine.connection.rtc;
        rtcService.createClientConnection(this);

        $('.error-message').remove();
        let offer = $('#remote-client-offer').val();
        if (!offer) {
            console.error('[MainMenu/RTC] Expected offer.');
            return;
        }
        let localServerModel = this.stateManager.app.model.localServer;
        localServerModel.setLocalClientOffer(offer);

        rtcService.createClientAnswer(offer);
    },

    answerSent(answer)
    {
        let localServerModel = this.stateManager.app.model.localServer;
        localServerModel.setLocalClientAnswer(answer);

        $('#remote-client-answer').val(answer);
    },

    notifyServerFailed()
    {
        let button = $('#button-connect-webrtc-server');
        button.removeClass('status-checking');
        button.removeClass('status-connected');
        button.addClass('status-error');
    },

    notifyServerChecking()
    {
        // Front notif on button.
        let button = $('#button-connect-webrtc-server');
        button.removeClass('status-error');
        button.removeClass('status-connected');
        button.addClass('status-checking');
    },

    notifyServerConnected(rtcSocket)
    {
        let button = $('#button-connect-webrtc-server');
        button.removeClass('status-checking');
        button.removeClass('status-error');
        button.addClass('status-connected');
        this.stateManager.app.startFromRemoteSandbox(rtcSocket);
    },

    // ######### RTC SERVER METHODS #########

    getRTCUserHTML(userID, offer, answer, isConnected)
    {
        if (!offer) offer = '';
        else offer = offer.replace(/\x22/g, '&quot;');
        if (!answer) answer = '';
        else answer = answer.replace(/\x22/g, '&quot;');
        let status = `status-${isConnected ? 'connected' : 'error'}`;

        return `
            <div class="row col-12"><div class="col-12">

            <div class="input-group mb-1" id="${userID}">
                <div class="input-group-prepend">
                    <span class="input-group-text ${status}" id="status-${userID}">@${userID}</span>
                </div>
                <div class="input-group-append" style="margin-right: -1px;">
                    <span class="input-group-text">Offer</span>
                </div>

                <input type="text" id="offer-user-${userID}"
                    class="form-control" placeholder="Offer" value="${offer}">

                <div class="input-group-append" style="margin-right: -1px;">
                    <span class="input-group-text">Answer</span>
                </div>

                <input type="text" id="answer-user-${userID}"
                    class="form-control" placeholder="Answer" value="${answer}">

                <div class="input-group-append">
                    <button id="button-connect-user-${userID}"
                        class="btn btn-outline-light" type="button">Connect User</button>
                </div>
                <div class="input-group-append">
                    <button id="button-disconnect-user-${userID}"
                        class="btn btn-outline-light" type="button">Disconnect User</button>
                </div>
            </div>

            </div>
            `;
    },

    getRTCUsers()
    {
        let localServerModel = this.stateManager.app.model.localServer;
        let users = localServerModel.users;
        let usersHTML = '<div class="list-group" id="user-slots">';
        users.forEach((user, userID) => {
            usersHTML += this.getRTCUserHTML(userID, user.offer, user.answer, user.connected);
        });
        usersHTML += '</div>';
        return usersHTML;
    },

    notifyRTCError(errorType)
    {
        $('.error-message').remove();
        let userSlotsHTML = errorType === 'ice-failed-client' ?
            $('#error-remote-sandbox') : $('#user-slots');

        let errorMsgConsole = '';
        let errorMsgHTML = '';
        switch (errorType) {
            case 'user-id-empty':
                errorMsgConsole = '[States/MainMenu] User ID must not be empty.';
                errorMsgHTML =  `<div class="alert alert-danger error-message">
                    Please specify a Player ID (name)</div>`;
                break;
            case 'user-id-taken':
                errorMsgConsole = '[States/MainMenu] User ID already used.';
                errorMsgHTML = `<div class="alert alert-danger error-message">
                    Player ID invalid or already taken</div>`;
                break;
            case 'ice-failed-server':
            case 'ice-failed-client':
                errorMsgConsole = '[States/MainMenu] ICE exchange failed.';
                errorMsgHTML = `<div class="alert alert-danger error-message">
                    Cannot connect. Possible causes: <br />AdBlock (uncheck WebRTC protection);<br />
                    Firefox client timeout (10-15s);<br />
                    Network / firewall settings.</div>`;
                break;
            default: break;
        }
        console.log(errorMsgConsole);
        userSlotsHTML.append(errorMsgHTML);
    },

    notifyUserChecking(userID)
    {
        let element = $(`#status-${userID}`);
        element.removeClass('status-error');
        element.removeClass('status-connected');
        element.addClass('status-checking');
    },

    notifyUserConnected(userID, newChannel, newConnection, rtcSocket)
    {
        let element = $(`#status-${userID}`);
        element.removeClass('status-checking');
        element.removeClass('status-error');
        element.addClass('status-connected');
        let localServer = this.stateManager.app.model.localServer;
        localServer.setUserConnectionStatus(userID, true);
        localServer.setUserChannel(userID, newChannel);
        this.stateManager.app.clientConnectedToLocalSandbox(userID, rtcSocket);
    },

    notifyUserDisconnected(userID)
    {
        let element = $(`#status-${userID}`);
        element.removeClass('status-checking');
        element.removeClass('status-connected');
        element.addClass('status-error');
        this.stateManager.app.model.localServer.setUserConnectionStatus(userID, false);
        $(`#answer-user-${userID}`).val();
        $(`#offer-user-${userID}`).val();
    },

    addUserSlot()
    {
        let newUserID = $('#new-user-id').val();
        let userSlotsHTML = $('#user-slots');

        $('.error-message').remove();
        if (newUserID.length < 1) {
            this.notifyRTCError('user-id-empty');
            return;
        }

        let localServerModel = this.stateManager.app.model.localServer;
        let rtcService = this.stateManager.app.engine.connection.rtc;

        // Reconnection
        if (localServerModel.isUserConnectionAvailable(newUserID)) {
            $(`#answer-user-${newUserID}`).val('');
            rtcService.addServerSlot(newUserID, this, true);
            return;
        }

        if ($(`#${newUserID}`).length !== 0 || localServerModel.hasUser(newUserID)) {
            this.notifyRTCError('user-id-taken');
            return;
        }

        userSlotsHTML.append(
            this.getRTCUserHTML(newUserID)
        );
        // $('#announce').center();

        localServerModel.addUser(newUserID);
        rtcService.addServerSlot(newUserID, this);
    },

    removeUserSlot(userID)
    {
        let localServerModel = this.stateManager.app.model.localServer;
        localServerModel.removeUser(userID);

        // Remove listeners
        $(`#button-connect-user-${userID}`).off('click');
        $(`#button-disconnect-user-${userID}`).off('click');

        // Remove elements
        let offerElement = $(`#${userID}`);
        offerElement.remove();

        $('#announce').center();
    },

    serverSlotCreated(userID, offer, connection)
    {
        let offerElement = $(`#offer-user-${userID}`);
        if (!offerElement) {
            console.error(`[States/MainMenu] User "${userID}" HTML element not found.`);
            return;
        }
        offerElement.val(offer);
        let localServerModel = this.stateManager.app.model.localServer;
        localServerModel.setUserOffer(userID, offer);
        localServerModel.setUserConnection(userID, connection);

        this.listenButtonConnectUser(userID);
        this.listenButtonDisconnectUser(userID);
    },

    listenRTCUsers()
    {
        let localServerModel = this.stateManager.app.model.localServer;
        let users = localServerModel.users;
        users.forEach((user, userID) => {
            this.listenButtonConnectUser(userID);
            this.listenButtonDisconnectUser(userID);
        });
    },

    listenButtonConnectUser(userID)
    {
        let rtcService = this.stateManager.app.engine.connection.rtc;
        let localServerModel = this.stateManager.app.model.localServer;
        $(`#button-connect-user-${userID}`).click(() => {
            let user = localServerModel.getUser(userID);
            if (!user) {
                console.error(`User "${userID}" not found.`);
                return;
            }
            let answer = $(`#answer-user-${userID}`).val();
            if (!answer || answer.length < 1) {
                console.error(`Invalid answer: ${answer}`);
                return;
            }
            rtcService.acceptInboundConnection(user.inboundConnection, answer);
        });
    },

    listenButtonDisconnectUser(userID)
    {
        let rtcService = this.stateManager.app.engine.connection.rtc;
        let localServerModel = this.stateManager.app.model.localServer;
        $(`#button-disconnect-user-${userID}`).click(() => {
            let user = localServerModel.getUser(userID);
            if (!user) {
                console.error(`User "${userID}" not found.`);
                return;
            }
            rtcService.disconnectUser(userID);

            // Remove user slot HTML and user model.
            this.removeUserSlot(userID);
        });
    }

});

export { MainMenuState };
