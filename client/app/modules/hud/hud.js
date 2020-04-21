/**
 * In-game user interface.
 */

'use strict';

import extend              from '../../extend.js';
import $                   from 'jquery';
import { HUDWorldsModule } from './hud.worlds';

let Hud = function(register) {
    this.register = register;
    this.orangeColor = '#c96530';
    this.sigma = null;

    this.html = `
        <div id="hud">
            <div id="position"></div>
            <div id="diagram"></div>
            <div id="items"></div>
            <!-- <div id="item_offset"></div> -->
            <!-- <div id="item_orientation"></div> -->
            <!-- <div id="chat"></div>-->
        </div>
        <div id="network-graph">
        </div>
    `;
};

extend(Hud.prototype, {

    // Game started
    initModule() {
        let announce = $('#announce');
        announce.before(this.html);
        this.initSigma();
    },

    // Game ended
    disposeModule() {
        $('#hud').remove();
        $('#network-graph').remove();
        this.killSigma();
    },

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
            this.refreshHUDWorldGraph(newState.diagram);
        }

        if (newState.hasOwnProperty('activeItem')) {
            let h = newState.activeItem;
            $('#items')
                .text(h)
                .css('color', this.orangeColor);
        }

        // if (newState.hasOwnProperty('itemOrientation')) {
        // let or = newState.itemOrientation;
        // $('#item_orientation')
        //     .text(or)
        //     .css('color', this.orangeColor);
        // }

        // if (newState.hasOwnProperty('itemOffset')) {
        // let of = newState.itemOffset;
        // $('#item_offset')
        //     .text(of)
        //     .css('color', this.orangeColor);
        // }
    }

});

extend(Hud.prototype, HUDWorldsModule);

export { Hud };
