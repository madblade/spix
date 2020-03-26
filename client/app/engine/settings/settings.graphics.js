/**
 *
 */

'use strict';

import $ from 'jquery';

let GraphicsModule = {

    getGraphicsHTML(graphicsSettings) {
        let content = '<table class="table table-bordered" style="width:100%" class="noselect">';

        for (let s in graphicsSettings) {
            content += `<tr><td>${graphicsSettings[s]}</td></tr>`;
        }

        content += '<tr id="return"><td>Return</td></tr>';
        content += '</table>';
        return content;
    },

    goGraphics() {
        this.unlistenSettingsMenu();
        $('#announce')
            .empty()
            .append(this.getGraphicsHTML(this.graphicsSettings));
        this.listenReturn();
    },

    listenGraphics() {

    }

};

export { GraphicsModule };
