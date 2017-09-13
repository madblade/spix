/**
 * Ingame user interface.
 */

'use strict';

App.Modules.Hud = function(register) {
    this.register = register;
};

extend(App.Modules.Hud.prototype, {

    updateSelfState: function(newState) {
        if (newState.hasOwnProperty('position')) {
            var f = Math.floor;
            var p = newState['position'];
            var text = f(p[0]) + ', ' + f(p[1]) + ', ' + f(p[2]);
            $("#position").text(text).css('color', 'orange');
        }

        if (newState.hasOwnProperty('diagram')) {
            var d = newState['diagram'];

            var s = d.split(/\r?\n/g);
            var colors = ['lime', 'orange', 'red', 'cyan'];
            for (var is = 0, il = s.length; is < il; ++is) {
                // Display
                var color = 'white';
                colors.forEach(function(c) {
                    if (s[is].indexOf(c) > -1) color = c;
                });

                s[is] = s[is].replace(color, '');
                s[is] = s[is].replace('{', '<span style="color:' + color + ';">');
                s[is] = s[is].replace('}', '</span>');
            }

            s = s.join('<br />');

            // Wrap
            s = '<p style="color:white;">' + s + '</p>';
            $('#diagram').html(s); // .css('color', 'cyan');
        }

        if (newState.hasOwnProperty('active_item')) {
            var h = newState['active_item'];
            $('#items').text(h).css('color', 'orange');
        }
        
        if (newState.hasOwnProperty('item_orientation')) {
            var or = newState['item_orientation'];
            $('#item_orientation').text(or).css('color', 'orange');
        }
        
        if (newState.hasOwnProperty('item_offset')) {
            var of = newState['item_offset'];
            $('#item_offset').text(of).css('color', 'orange');
        }

    }

});
