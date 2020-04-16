/**
 * In-game user interface.
 */

'use strict';

import extend              from '../../extend.js';
import $                   from 'jquery';
import { sigma as Sigma }  from 'sigma';
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
            let graph = this.sigma.graph;
            // this.sigma.stopForceAtlas2();
            graph.clear();
            let nodeSet = new Set();
            let depthMap = new Map();

            let d = newState.diagram;
            for (let i = 0, l = d.length; i < l; ++i) {
                let di = d[i];
                if (!di.origin || !di.destination) continue;

                if (!nodeSet.has(di.origin)) {
                    let currentDepth = parseInt(di.depth, 10);
                    let currentH = depthMap.get(currentDepth);
                    if (!currentH) currentH = 0;
                    depthMap.set(currentDepth, currentH + 1);

                    nodeSet.add(di.origin);
                    graph.addNode({
                        id: di.origin, label: di.origin.toString(), size: 1,
                        y: 0.2 * currentDepth,
                        x: 0.2 * (currentH + 1),
                        color: i === 0 ? 'blue' : 'orange'
                    });
                }
                if (!nodeSet.has(di.destination)) {
                    let currentDepth = parseInt(di.depth, 10);
                    let currentH = depthMap.get(currentDepth + 1);
                    if (!currentH) currentH = 0;
                    depthMap.set(currentDepth + 1, currentH + 1);

                    nodeSet.add(di.destination);
                    graph.addNode({
                        id: di.destination, label: di.destination.toString(), size: 1,
                        y: 0.2 * (currentDepth + 1),
                        x: 0.2 * (currentH + 1),
                        color: 'orange'
                    });
                }
                graph.addEdge({
                    id: di.pid, // path
                    color: di.type, // ['lime', 'orange', 'red', 'cyan', yellow];
                    source: di.origin, target: di.destination,
                    // label: di.pid,
                    // edgeLabelColor: di.type
                });
            }

            console.log(this.sigma.graph.edges());
            console.log(this.sigma.graph.nodes());
            console.log(d.length);
            console.log(d);
            console.log('was the flat graph');
            this.sigma.refresh();
            // this.sigma.startForceAtlas2();
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
