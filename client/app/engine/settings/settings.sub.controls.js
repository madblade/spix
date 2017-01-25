/**
 *
 */

'use strict';

extend(App.Engine.Settings.prototype, {

    getControlsHTML: function(controlsSettings) {
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
    },

    goControls: function() {
        this.unlistenHome();
        $("#announce").empty().append(this.getControlsHTML(this.controlsSettings));
        this.listenReturn();
        this.listenControls();
    },

    listenControls: function() {
        var controlsEngine = this.app.engine.controls;

        var l = $('#language');
        l.change(function() {
            var selected = l.find('option:selected').val();
            controlsEngine.changeLayout(selected, true); // Don't restart listeners.
        });
    },

    unlistenControls: function() {
        $('#language').off('change');
    }

});
