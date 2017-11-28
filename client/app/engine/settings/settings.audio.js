/**
 *
 */

'use strict';

import $ from 'jquery';

var AudioModule = {

    getAudioHTML: function(audioSettings) {
        var content = '<table class="table table-bordered" style="width:100%" class="noselect">';
        content += '<tr id="return"><td>Return</td></tr>';

        for (var s in audioSettings) {
            content += '<tr><td>' + audioSettings[s] + '</td></tr>';
        }

        content += '</table>';
        return content;
    },

    goAudio: function() {
        this.unlistenHome();
        $('#announce')
            .empty()
            .append(this.getAudioHTML(this.audioSettings));
        this.listenReturn();
    },

    listenAudio: function() {

    }

};

export { AudioModule };
