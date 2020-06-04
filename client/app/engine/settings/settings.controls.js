/**
 *
 */

'use strict';

import $ from 'jquery';

let ControlsModule = {

    getControlsHTML(controlsSettings)
    {
        let content = `
            <div class="container">
            <table class="table table-bordered noselect" style="width:100%">
        `;

        if (controlsSettings.hasOwnProperty('language')) {
            let language = `
                <select id="language" class="form-control">
                    <option value="default">Choose your layout:</option>
                    <option value="en">en</option>
                    <option value="fr">fr</option>
                </select>`;

            content += `<tr><td>Keyboard layout</td><td>${language}</td></tr>`;
        }

        content += `
            <tr id="return"><td colspan="2">Return</td></tr>
            </table>
            </div>`;

        return content;
    },

    goControls()
    {
        this.unlistenSettingsMenu();
        $('#announce')
            .empty()
            .append(this.getControlsHTML(this.controlsSettings));
        this.listenReturn();
        this.listenControls();
    },

    listenControls()
    {
        let controlsEngine = this.app.engine.controls;

        if (this.controlsSettings.hasOwnProperty('language')) {
            let l = $('#language');
            l.change(function() {
                let selected = l.find('option:selected').val();
                controlsEngine.changeLayout(selected, true); // Don't restart listeners.
            });
        }
    },

    unlistenControls()
    {
        if (this.controlsSettings.hasOwnProperty('language')) {
            $('#language').off('change');
        }
    }

};

export { ControlsModule };
