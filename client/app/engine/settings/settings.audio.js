/**
 *
 */

'use strict';

import $ from 'jquery';

let AudioModule = {

    getAudioHTML(audioSettings) {
        let content = '<table class="table table-bordered" style="width:100%" class="noselect">';
        content += '<tr id="return"><td>Return</td></tr>';

        for (let s in audioSettings) {
            content += `<tr><td>${audioSettings[s]}</td></tr>`;
        }

        content += '</table>';
        return content;
    },

    goAudio() {
        this.unlistenHome();
        $('#announce')
            .empty()
            .append(this.getAudioHTML(this.audioSettings));
        this.listenReturn();
    },

    listenAudio() {

    }

};

export { AudioModule };
