/**
 *
 */

'use strict';

import { $ }                from '../../modules/polyfills/dom.js';

import extend               from '../../extend.js';

import { AudioModule }      from './settings.audio.js';
import { ControlsModule }   from './settings.controls.js';
import { GraphicsModule }   from './settings.graphics.js';
import { HomeModule }       from './settings.home.js';

let Settings = function(app)
{
    this.app = app;

    this.listeners = [];
};

extend(Settings.prototype, {

    run()
    {
        let app = this.app;

        this.controlsEngine =   app.engine.controls;
        this.stateManager =     app.state;

        this.graphicsSettings = app.engine.graphics.settings;
        this.controlsSettings = app.engine.controls.settings;
        this.audioSettings =    app.engine.audio.settings;

        // Add content, then fade in and add listeners.
        $('#announce')
            .empty()
            .removeClass()
            .addClass('settings')
            .append(this.getHomeHTML())
            .center()
            .fadeIn();

        this.listenHome();
    },

    stop()
    {
        // Fade out settings menu.
        this.unlistenSettingsMenu();
        return new Promise(function(resolve) {
            let settings = $('#announce');
            settings.fadeOut(200, function() {
                settings.empty().removeClass('settings');
                resolve();
            });
        });
    },

    unlisten()
    {
        this.listeners.forEach(function(listener) {
            let element = $(`#${listener}`);
            element.off('click');
            element.off('keydown');
        });

        this.listeners = [];
    }

});

extend(Settings.prototype, AudioModule);
extend(Settings.prototype, ControlsModule);
extend(Settings.prototype, GraphicsModule);
extend(Settings.prototype, HomeModule);

export { Settings };
