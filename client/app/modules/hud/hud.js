/**
 * In-game user interface.
 */

'use strict';

import extend           from '../../extend.js';
import $                from 'jquery';

let Hud = function(register) {
    this.register = register;
    this.orangeColor = '#c96530';
};

extend(Hud.prototype, {

    updateSelfState(newState) {
        if (newState.hasOwnProperty('position')) {
            let f = Math.floor;
            let p = newState.position;
            let text = `${f(p[0])}, ${f(p[1])}, ${f(p[2])}`;
            $('#position')
                .text(text)
                .css('color', this.orangeColor);
        }

        if (newState.hasOwnProperty('diagram')) {
            let d = newState.diagram;

            let s = d.split(/\r?\n/g);
            let colors = ['lime', 'orange', 'red', 'cyan'];
            for (let is = 0, il = s.length; is < il; ++is) {
                // Display
                let color = 'white';

                for (let ic = 0; ic < colors.length; ++ic)
                    if (s[is].indexOf(colors[ic]) > -1) {
                        color = colors[ic];
                        break;
                    }

                s[is] = s[is].replace(color, '');
                s[is] = s[is].replace('{', `<span style="color:${color};">`);
                s[is] = s[is].replace('}', '</span>');
            }

            s = s.join('<br />');

            // Wrap
            s = `<p style="color:white;">${s}</p>`;
            $('#diagram').html(s); // .css('color', 'cyan');
        }

        if (newState.hasOwnProperty('activeItem')) {
            let h = newState.activeItem;
            $('#items')
                .text(h)
                .css('color', this.orangeColor);
        }

        if (newState.hasOwnProperty('itemOrientation')) {
            let or = newState.itemOrientation;
            $('#item_orientation')
                .text(or)
                .css('color', this.orangeColor);
        }

        if (newState.hasOwnProperty('itemOffset')) {
            let of = newState.itemOffset;
            $('#item_offset')
                .text(of)
                .css('color', this.orangeColor);
        }
    }

});

export { Hud };
