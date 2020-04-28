/**
 * In-game user interface.
 */

'use strict';

import extend                   from '../../extend.js';
import $                        from 'jquery';
import { HUDWorldsModule }      from './hud.worlds';
import { HUDInventoryModule }   from './hud.inventory';

let Hud = function(register)
{
    this.register = register;
    this.orangeColor = '#c96530';
    this.sigma = null;

    this.html = `
        <div id="hud" class="noselect">
            <div id="position"></div>
            <div id="diagram"></div>
            <!-- <div id="item_offset"></div> -->
            <!-- <div id="item_orientation"></div> -->
            <!-- <div id="chat"></div>-->
            <div id="network-graph"></div>
            <div id="mini-map"></div>
        </div>
        <div id="items" class="noselect">
            <div id="item-table">
            <div class="square"><div class="content selected" id="item1"></div></div>
            <div class="square"><div class="content" id="item2"></div></div>
            <div class="square"><div class="content" id="item3"></div></div>
            <div class="square"><div class="content" id="item4"></div></div>
            <div class="square"><div class="content" id="item5"></div></div>
            <div class="square"><div class="content" id="item6"></div></div>
            <div class="square"><div class="content" id="item7"></div></div>
            <div class="square"><div class="content" id="item8"></div></div>
            </div>
        </div>
    `;
};

extend(Hud.prototype, {

    // Game started
    initModule() {
        let announce = $('#announce');
        announce.before(this.html);

        // World map renderer
        this.initSigma();

        // Quick items
        this.initInventory();
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
extend(Hud.prototype, HUDInventoryModule);

export { Hud };
