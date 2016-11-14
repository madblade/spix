/**
 *
 */

'use strict';

App.Engine.Settings.prototype.getControlsHTML = function(controlsSettings) {
    var content = '<table class="table table-bordered" style="width:100%" class="noselect">';

    if (controlsSettings.hasOwnProperty('language')) {
        var language =  '<select id="language" class="form-control">' +
            '<option value="default">Choose your layout:</option>' +
            '<option value="en">en</option>' +
            '<option value="fr">fr</option>' +
            '</select>';

        content +='<tr><td>Keyboard layout</td>' + '<td>' + language + '</td></tr>';
    }

    content += '<tr id="return"><td colspan="2">Return</td></tr>';
    content += '</table>';

    return content;
};

App.Engine.Settings.prototype.goControls = function() {
    this.unlistenHome();
    $("#announce").empty().append(this.getControlsHTML(this.controlsSettings));
    this.listenReturn();
    this.listenControls();
};

App.Engine.Settings.prototype.listenControls = function() {
    var l = $('#language');
    l.change(function() {
        var selected = l.find('option:selected').val();
        this.controlsEngine.changeLayout(selected, true); // Don't restart listeners.
    }.bind(this));
};

App.Engine.Settings.prototype.unlistenControls = function() {
    $('#language').off('change');
};
