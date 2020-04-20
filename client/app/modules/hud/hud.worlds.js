/**
 * Multiverse topology display.
 * (portal connectivity)
 */

'use strict';

let HUDWorldsModule =
{
    refreshHUDWorldGraph(newDiagram) {
        let graph = this.sigma.graph;
        // this.sigma.stopForceAtlas2();
        graph.clear();
        let nodeSet = new Set();
        let depthMap = new Map();

        let d = newDiagram;
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

        // console.log(this.sigma.graph.edges());
        // console.log(this.sigma.graph.nodes());
        console.log('[HUD] New flat graph:');
        console.log(d);
        this.sigma.refresh();
        // this.sigma.startForceAtlas2();
    }
};

export { HUDWorldsModule };
