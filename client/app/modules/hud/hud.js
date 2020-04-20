/**
 * In-game user interface.
 */

'use strict';

import extend              from '../../extend.js';
import $                   from 'jquery';
import { sigma as Sigma }  from 'sigma';
import { HUDWorldsModule } from './hud.worlds';
// import 'sigma/plugins/sigma.renderers.edgeLabels/settings';
// import 'sigma/plugins/sigma.renderers.edgeLabels/sigma.canvas.edges.labels.def';
// import 'sigma/plugins/sigma.renderers.edgeLabels/sigma.canvas.edges.labels.curve';
// import 'sigma/plugins/sigma.renderers.edgeLabels/sigma.canvas.edges.labels.curvedArrow';

let Hud = function(register) {
    this.register = register;
    this.orangeColor = '#c96530';

    this.sigma = new Sigma({
        graph: {nodes:[], edges: []},
        renderer: {
            container: document.getElementById('network-graph'),
            type: 'canvas'
        },
        // container: 'network-graph',
        // container: 'diagram',
        settings: {
            minArrowSize: 20,
            defaultNodeColor: '#ec5148',
            drawLabels: true,
            labelThreshold: 0,
            // enableHovering: false
            // defaultEdgeLabelSize: 20,
            // edgeLabelSize: 'fixed',
        }
    });
};

extend(Hud.prototype, {

    // Game started
    initModule() {
    },

    // Game ended
    disposeModule() {
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

extend(Hud.prototype, HUDWorldsModule);

export { Hud };
