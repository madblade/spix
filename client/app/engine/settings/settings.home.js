/**
 *
 */

'use strict';

import $ from 'jquery';

let HomeModule = {

    getHomeHTML() {
        return `
            <table class="table table-bordered" style="width:100%" class="noselect">
            <tr id="graphics"><td>Graphics</td></tr>
            <tr id="gameplay"><td>Gameplay</td></tr>
            <tr id="audio"><td>Audio</td></tr>
            <tr id="return"><td>Return</td></tr>
            <tr id="home"><td>Exit</td></tr>
            </table>
        `;
    },

    goHome() {
        this.unlistenSettingsMenu();
        $(window).off('keydown');
        // this.app.setState('loading');
        this.app.engine.connection.send('leave');
        this.app.stopGame();
        let hub = this.app.model.hub;
        hub.enterHub();
    },

    listenHome() {
        $('#graphics').click(function() { this.goGraphics(); }.bind(this));
        $('#gameplay').click(function() { this.goControls(); }.bind(this));
        $('#audio').click(function() { this.goAudio(); }.bind(this));
        $('#home').click(function() { this.goHome(); }.bind(this));
        $('#return').click(function() {
            $(window).off('keydown');
            this.unlistenSettingsMenu();
            this.stateManager.setState('ingame');
            this.controlsEngine.requestPointerLock();
            this.app.setFocused(true);
        }.bind(this));
        $(window).keydown(function(event) {
            if (!event.keyCode) { return; }
            if (event.keyCode === this.controlsEngine.keyControls.escape) {
                // Remove listeners and get away from the bike.
                this.unlistenSettingsMenu();
                this.stateManager.setState('ingame');
            }
        }.bind(this));

        // TODO [LOW] use listeners array.
        // this.listeners.push('graphics', 'gameplay', 'audio', 'home', 'return');
    },

    unlistenSettingsMenu() {
        $(window).off('keydown');
        $('#graphics').off('click');
        $('#gameplay').off('click');
        $('#audio').off('click');
        $('#home').off('click');
        $('#return').off('click');
    },

    listenReturn() {
        $('#return').click(function() {
            $('#return').off('click');
            $('#announce')
                .empty()
                .append(this.getHomeHTML());
            this.listenHome();
        }.bind(this));
    }

};

export { HomeModule };
