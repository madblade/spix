/**
 *
 */

'use strict';

extend(App.Engine.Settings.prototype, {

    getGraphicsHTML: function(graphicsSettings) {
        var content = '<table class="table table-bordered" style="width:100%" class="noselect">';

        for (var s in graphicsSettings) {
            content +='<tr><td>' + graphicsSettings[s] + '</td></tr>';
        }

        content += '<tr id="return"><td>Return</td></tr>';
        content += '</table>';
        return content;
    },

    goGraphics: function() {
        this.unlistenHome();
        $("#announce").empty().append(this.getGraphicsHTML(this.graphicsSettings));
        this.listenReturn();
    },

    listenGraphics: function() {

    }

});
