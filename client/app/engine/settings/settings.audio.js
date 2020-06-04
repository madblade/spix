/**
 *
 */

'use strict';

import $ from 'jquery';

let AudioModule = {

    getAudioHTML(audioSettings)
    {
        let content = `
            <div class="container">
            <table class="table table-bordered noselect" style="width:100%">
                <tr id="return"><td>Return</td></tr>
        `;

        for (let s in audioSettings) {
            content += `<tr><td>${audioSettings[s]}</td></tr>`;
        }

        content += `
            </table>
            </div>`;
        return content;
    },

    goAudio()
    {
        this.unlistenSettingsMenu();
        $('#announce')
            .empty()
            .append(this.getAudioHTML(this.audioSettings));
        this.listenReturn();
    },

    listenAudio()
    {

    }

};

export { AudioModule };
