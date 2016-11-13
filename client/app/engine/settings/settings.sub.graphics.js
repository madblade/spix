/**
 *
 */

'use strict';

App.Engine.Settings.prototype.getGraphicsHTML = function(graphicsSettings) {
    var content = '<table class="table table-bordered" style="width:100%" class="noselect">';

    for (var s in graphicsSettings) {
        content +='<tr><td>' + graphicsSettings[s] + '</td></tr>';
    }

    content += '<tr id="return"><td>Return</td></tr>';
    content += '</table>';
    return content;
};

App.Engine.Settings.prototype.goGraphics = function() {
    this.unlistenHome();
    $("#announce").empty().append(this.getGraphicsHTML(this.graphicsSettings));
    this.listenReturn();
};

App.Engine.Settings.prototype.listenGraphics = function() {

};
