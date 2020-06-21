/**
 *
 */

'use strict';

import extend           from '../../../extend.js';

let XNode;
let XArc;
let XGraph;

XNode = function(nodeId, parentArc)
{
    this.nodeId = nodeId;
    if (parentArc) {
        this.parentArcs = [parentArc];
    } else {
        this.parentArcs = [];
    }
    this.childrenArcs = [];
};

extend(XNode.prototype, {

    getNodeId()
    {
        return this.nodeId;
    },

    getNumberOfChildren()
    {
        return this.childrenArcs.length;
    },

    addExistingChild(arcId, node, xgraph)
    {
        let arc = new XArc(this, node, arcId);
        xgraph.setArc(arcId, this);
        node.parentArcs.push(arc);
        this.childrenArcs.push(arc);
        return node;
    },

    addNewChild(arcId, nodeId, xgraph)
    {
        let node = new XNode(nodeId);
        let arc = new XArc(this, node, arcId);
        xgraph.setArc(arcId, arc);
        node.parentArcs.push(arc);
        this.childrenArcs.push(arc);
        return node;
    },

    getParentArcs()
    {
        if (this.parentArcs === null)
            throw Error('Root has no parent.');
        return this.parentArcs;
    },

    getChildrenArcs()
    {
        return this.childrenArcs;
    },

    forEachChild(callback)
    {
        this.childrenArcs.forEach(function(arc) {
            callback(arc);
        });
    }

});

XArc = function(parentNode, childNode, arcId)
{
    this.arcId = arcId;
    this.parentNode = parentNode;
    this.childNode = childNode;
};

extend(XArc.prototype, {

    getChild()
    {
        return this.childNode;
    },

    getParent()
    {
        return this.parentNode;
    },

    getArcId()
    {
        return this.arcId;
    }

});

XGraph = function(rootId)
{
    this.root = new XNode(rootId, null);
    this.nodes = new Map();
    this.arcs = new Map();
    this.nodes.set(rootId, this.root);

    // Flat version going from root, linked to rendering graph strategy.
    this.flatGraph = [];
};

// Node are used for worlds,
// Arcs for portals.
extend(XGraph.prototype, {

    setArc(arcId, arc)
    {
        if (this.arcs.has(arcId)) console.log('XGraph: adding an existing arc to the graph.');
        this.arcs.set(arcId, arc);
    },

    insertNode(newArcId, forwardArcId, newNodeId, parentNodeId)
    {
        newArcId = `${newArcId},${forwardArcId}`;

        let node = this.nodes.get(parentNodeId);
        if (!node) {
            node = new XNode(parentNodeId, null);
            this.nodes.set(parentNodeId, node);
        }

        let newNode = this.nodes.get(newNodeId);
        if (newNode) {
            // N.B. graph passed to add arc to model
            node.addExistingChild(newArcId, newNode, this);
        } else {
            newNode = node.addNewChild(newArcId, newNodeId, this);
            this.nodes.set(newNodeId, newNode);
        }

        return newNode;
    },

    hasNode(nodeId)
    {
        return this.nodes.has(nodeId);
    },

    getNode(nodeId)
    {
        return this.nodes.get(nodeId);
    },

    switchRoot(oldRootId, newRootId)
    {
        // Allow only 1-length switch at a time.
        let oldRoot = this.root;
        if (oldRoot.getNodeId() !== oldRootId) {
            console.log('XGraph Error: trying to switch from invalid root.');
            return;
        }

        let children = oldRoot.getChildrenArcs();
        if (!children) return; // No other world.

        let currentArc; let currentNode; let currentNodeId;
        for (let cid = 0, nbc = children.length; cid < nbc; ++cid) {
            currentArc = children[cid];
            currentNode = currentArc.getChild();
            if (!currentNode) continue;

            currentNodeId = currentNode.getNodeId();
            if (currentNodeId === newRootId) {
                // Do switch root with corresponding node.
                this.root = currentNode;
                break;
            }
        }
    },

    // Given an arc (portal), breadth-first apply a function
    // that go from it (or the root) to the leaves or to a specified arc id.
    // Generic BFS.
    applyFromPosition(starterArcId, deepestArcId, callback)
    {
        let starterNode = this.root;
        if (starterArcId) {
            let starterArc = this.arcs.get(starterArcId);
            if (!starterArc) { console.log('Error at XGraph: starter arc not found.'); return; }
            starterNode = starterArc.getChild();
        }

        let arcMarkers = new Set();
        let nodeMarkers = new Map();
        nodeMarkers.set(starterNode.getNodeId(), 0); // node id, depth

        let stack = [];
        let paths = []; // Arc paths. Nodes are easily deduced.
        let depths = [];

        let starterArcs = starterNode.childrenArcs;
        if (!starterArcs) { console.log('XGraph: no arc found.'); return; }
        starterArcs.forEach(function(arc) {
            stack.push(arc);
            paths.push(`${arc.getArcId()}`);
            depths.push(1);
        });

        let maxDepth = Number.POSITIVE_INFINITY;

        let head; let depth; let path;
        while (stack.length > 0)
        {
            // Get current element.
            head = stack.pop();
            path = paths.pop();
            depth = depths.pop();

            let currentId = head.getArcId();
            arcMarkers.add(currentId);
            if (currentId === deepestArcId) {
                maxDepth = depth;
            }

            let childNode = head.getChild();
            if (childNode && nodeMarkers.get(childNode.getNodeId()) < depth) continue;

            // Do callback.
            callback(head, path, depth);

            // Prepare next elements.
            let newDepth = depth + 1;
            if (newDepth > maxDepth) continue;
            // No other arc to process?
            if (!childNode) continue;
            // Node was already processed?
            let testNodeId = childNode.getNodeId();
            let testRecursedNode = nodeMarkers.get(testNodeId);
            if (testRecursedNode < newDepth) {
                // Here, node was already encountered,
                // so it is marked to avoid 1-step recursion.
                continue;
            }
            nodeMarkers.set(testNodeId, newDepth);

            let childrenArcs = childNode.getChildrenArcs();
            for (let i = 0, l = childrenArcs.length; i < l; ++i) {
                let arc = childrenArcs[i];

                let addedArcId = arc.getArcId();
                if (!arcMarkers.has(addedArcId)) {
                    stack.push(arc);
                    depths.push(newDepth);
                    paths.push(`${path},${addedArcId}`);
                }
            }
        }
    },

    toString()
    {
        let string = '';
        let flatGraph = this.flatGraph;

        let currentStep;
        for (let i = 0, l = flatGraph.length; i < l; ++i)
        {
            currentStep = flatGraph[i];
            // 0: depth
            // 1: type
            //      green: regular arc
            //      yellow: 0-order involution
            //      cyan: 1st order involution (the same pid as previously leads to the previous wid)
            //      orange: denote an independent cycle
            //      red: denote a dependant cycle (higher order involution)
            // 2: pid
            // 3: wid origin
            // 4: wid destination

            let dep = currentStep.depth;
            let mod = currentStep.type;
            let por = currentStep.pid;
            let ori = currentStep.origin;
            let ele = currentStep.destination;
            let pat = currentStep.path;
            let wpt = currentStep.wpath;

            for (let j = 0, d = dep; j < d; ++j) string += '\u00a0\u00a0\u00a0';
            string +=
                `${mod} w.${ori} w.{${ele}} p.${por} // ${pat}|${wpt}`;
            string += '\n';
        }

        return string;
    },

    computeCameraTransform(pidPath, portals) //, cameraManager
    {
        // let root = cameraManager.mainCamera;
        let cameraTransform = [
            0, 0, 0, // Position
            0, 0, 0  // Rotation
        ];

        // console.log('CAMERA TRANSFORMATION');
        // console.log(pidPath.length);
        for (let pathId = 0, pathLength = pidPath.length; pathId < pathLength; ++pathId)
        {
            let currentTunnel = pidPath[pathId].split(',');
            let sourcePortalId = parseInt(currentTunnel[0], 10);
            let sourcePortal = portals.get(sourcePortalId);
            let destinationPortalId = parseInt(currentTunnel[1], 10);
            let destinationPortal = portals.get(destinationPortalId);
            // console.log(sourcePortal);
            // console.log(destinationPortal);
            if (!destinationPortal || !sourcePortal) continue;

            let P0B0 = sourcePortal.tempPosition;
            let P0B1 = sourcePortal.tempOtherPosition;
            let P1B0 = destinationPortal.tempPosition;
            let P1B1 = destinationPortal.tempOtherPosition;
            let isX0 = P0B0[0] !== P0B1[0]; let isX1 = P1B0[0] !== P1B1[0];
            let isY0 = P0B0[1] !== P0B1[1]; let isY1 = P1B0[1] !== P1B1[1];
            let isZ0 = P0B0[2] !== P0B1[2]; let isZ1 = P1B0[2] !== P1B1[2];
            if (isX0 + isY0 + isZ0 !== 1 || isX1 + isY1 + isZ1 !== 1)
            {
                console.warn('[Tree/CameraTransform]: unmanaged portal type.');
                return;
            }
            let p0x = 0; let p0y = 0; let p0z = 0;
            let p1x = 0; let p1y = 0; let p1z = 0;
            switch (true) {
                case isX0: p0x = 0.5 * (P0B0[0] +  P0B1[0]); p0y = 0.5 + P0B0[1]; p0z = 0.5 + P0B1[2]; break;
                case isY0: p0y = 0.5 * (P0B0[1] +  P0B1[1]); p0x = 0.5 + P0B0[0]; p0z = 0.5 + P0B1[2]; break;
                case isZ0: p0z = 0.5 * (P0B0[2] +  P0B1[2]); p0y = 0.5 + P0B0[1]; p0x = 0.5 + P0B1[0]; break;
            }
            switch (true) {
                case isX1: p1x = 0.5 * (P1B0[0] +  P1B1[0]); p1y = 0.5 + P1B0[1]; p1z = 0.5 + P1B1[2]; break;
                case isY1: p1y = 0.5 * (P1B0[1] +  P1B1[1]); p1x = 0.5 + P1B0[0]; p1z = 0.5 + P1B1[2]; break;
                case isZ1: p1z = 0.5 * (P1B0[2] +  P1B1[2]); p1y = 0.5 + P1B0[1]; p1x = 0.5 + P1B1[0]; break;
            }

            if (p0x !== p1x || p0y !== p1y || p0z !== p1z)
            {
                // console.warn('[Tree/CameraTransform]: // TODO Compute camera chain transform.');
            }

            let thetaP0 = sourcePortal.tempOrientation;
            let thetaP1 = destinationPortal.tempOrientation;
            // let portalRelativeOrientation = [o1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];

            cameraTransform[0] += p1x - p0x;
            cameraTransform[1] += p1y - p0y;
            cameraTransform[2] += p1z - p0z;

            cameraTransform[3] += thetaP1 - thetaP0;
            // console.log(destinationPortalId);
            // console.log(destinationPortal.tempPosition);
            // console.log(destinationPortal.tempOrientation);

            // compose everything but NOT THE MAIN CAMERA!
        }

        // console.log('Computed Camera Transform.');
        // console.log(cameraTransform);
        return cameraTransform;
    },

    // Add cameras and everything and so on.
    computeRenderingGraph(graphicsEngine, xModel)
    {
        let flatGraph = this.flatGraph;
        if (flatGraph.length < 1) return;
        graphicsEngine.flushPortalUpdates();

        let cameraManager = graphicsEngine.cameraManager;
        // let worldToPortals = xModel.worldToPortals;

        let portals = xModel.portals; // Fixed by xModel

        let currentStep; let destinationWid; let originPid; let destinationPid;
        // let originWid; let widPath;
        let pidPathString; let pidPath;
        let depth;
        let cameraTransform;
        for (let i = 0, l = flatGraph.length; i < l; ++i)
        {
            currentStep = flatGraph[i];
            // originWid       = currentStep.origin;
            destinationWid  = currentStep.destination;
            originPid       = parseInt(currentStep.pid.split(',')[0], 10);
            destinationPid  = parseInt(currentStep.pid.split(',')[1], 10);
            pidPathString   = currentStep.path;
            pidPath         = pidPathString.split(';');
            // widPath         = currentStep.wpath.split(';');
            depth           = currentStep.depth;

            // console.log(currentStep.type);
            let p1;
            let p2;
            switch (currentStep.type)
            {
                case 'lime': // Regular.
                    // Add screen.
                    // Add camera.
                    // Add path to camera.
                    p1 = portals.get(originPid);
                    p2 = portals.get(destinationPid);
                    if (!p1 || !p2) {
                        console.log(`Problem while adding portal ${originPid}` +
                            ` / ${destinationPid}`);
                        console.log(`Origin: ${p1}, Destination ${p2}`); continue;
                    }

                    cameraTransform = this.computeCameraTransform(pidPath, portals, cameraManager);

                    graphicsEngine.addPortalObject(
                        p1, p2, pidPathString, cameraTransform,
                        depth, originPid, destinationPid, destinationWid, pidPathString
                    );

                    break;

                case 'orange':
                    // Add screen.
                    // Add camera to all descendants.

                    break;

                case 'yellow':
                    // Add screen.
                    // Add camera to descendants, after?
                    p1 = portals.get(originPid);
                    p2 = portals.get(destinationPid);
                    if (!p1 || !p2) {
                        console.log(`Problem while adding portal ${originPid}` +
                            ` / ${destinationPid}`);
                        console.log(`Origin: ${p1}, Destination ${p2}`); continue;
                    }

                    console.log(pidPath);
                    const pidPathLength = pidPath.length;
                    if (pidPathLength < 1)
                    {
                        console.error('[X/Tree] Expected a longer camera path.');
                        return;
                    }
                    cameraTransform = this.computeCameraTransform(pidPath, portals, cameraManager);

                    // console.log(cameraTransform);
                    // console.log(pidPathString);
                    // console.log(`pushing ${p1.portalId}`);
                    graphicsEngine.addPortalObject(
                        p1, p2, pidPathString, cameraTransform,
                        depth, originPid, destinationPid, destinationWid, pidPathString
                    );
                    // console.log(`pushing ${p2.portalId}`);
                    let pidPath2 = pidPath.slice(); // copy pid path 2
                    let commaSeparatedLink = pidPath[pidPathLength - 1];
                    let ids = commaSeparatedLink.split(',');
                    let newIds = `${ids[1]},${ids[0]}`;
                    pidPath2[pidPathLength - 1] = newIds;
                    let pidPathString2 = pidPath2.join(';');

                    cameraTransform = this.computeCameraTransform(pidPath2, portals, cameraManager);
                    // console.log(cameraTransform);
                    graphicsEngine.addPortalObject(
                        p2, p1, pidPathString2, cameraTransform,
                        depth, destinationPid, originPid, destinationWid, pidPathString2
                    );
                    break;

                case 'cyan':
                    // It rewires backwards.
                    // Do only when current camera isn't right camera

                    break;

                case 'red':
                    // Do nothing. Incorrect orientation of deeper
                    // cameras, however, should not be noticeable.
                    // Worst case: recurse on them.

                    break;

                default:
            }
        }

        // Optimisation: remove only screens that differ from last pass.
        // Add remaining ones asynchronously.
        graphicsEngine.unflushPortalUpdates();
    },

    // Compute a graph representation, starting from the root. Custom BFS.
    computeFlatGraph()
    {
        let flatGraph = [];
        let currentStep;

        let currentElement;
        let currentElementId;
        let currentArc;
        let currentArcId;
        let currentOtherEnd;

        let currentPidPath; let currentWidPath;
        let marks = new Set(); // Verification.
        let markedPaths = new Set();
        let queueNodes = [this.root];
        let queueOtherEnds = [null];

        let currentDepth = 0;
        let queueWidPaths = [''];
        let queuePidPaths = [''];
        let queueDepth = [currentDepth];
        let queueArcs = [null];
        let elementDepths = new Map();
        let elementPaths = new Map();
        let elementProcessed = false;

        // DFS.
        while (queueNodes.length > 0)
        {
            currentElement = queueNodes.pop();
            currentDepth = queueDepth.pop();
            currentArc = queueArcs.pop();
            currentPidPath = queuePidPaths.pop();
            currentWidPath = queueWidPaths.pop();
            currentOtherEnd = queueOtherEnds.pop();
            currentElementId = currentElement.getNodeId();

            elementProcessed = marks.has(currentElementId);
            //
            let b = currentPidPath.split(';');
            let c = b.pop().split(',')
                .reverse();
            b.pop(); b.push(c);
            let directInvolutionPath = b.join(';');
            //
            let e = currentPidPath.split(';'); e.pop(); e.join(';');
            let widArray = currentWidPath.split(';');

            if (currentArc)
            {
                currentArcId = currentArc.getArcId();
                currentStep = {};

                // Detect direct 0-involutions
                if (elementProcessed && currentOtherEnd &&
                    currentOtherEnd.getNodeId() === currentElementId) {
                    // Check element swap with next one.
                    // if (currentDepth)
                    currentStep.type = 'yellow';
                }

                else if (elementProcessed && markedPaths.has(directInvolutionPath)) {
                    // Detect direct 1-involutions.
                    currentStep.type = 'cyan';
                }

                // Dependent cycle (full path is common)
                else if (elementProcessed && widArray.indexOf(currentElementId) > -1) {
                    currentStep.type = 'red';
                }

                // Independent cycle (path is partly common)
                // It was detected because the current world is marked as processed.
                else if (elementProcessed) {
                    currentStep.type = 'orange';
                }

                // Regular path (at first pass, other derived may be considered degenerate).
                else if (!elementProcessed) {
                    currentStep.type = 'lime';
                }

                currentStep.depth = currentDepth;
                //if (currentOtherEnd)
                // XXX [PORTAL] check. I guess an arc has always a parent and a child.
                currentStep.origin = currentOtherEnd.getNodeId();
                currentStep.destination = currentElementId;
                currentStep.pid = currentArcId;
                currentStep.path = currentPidPath; // Without the last pid.
                currentStep.wpath = currentWidPath; // Without the last wid.

                flatGraph.push(currentStep);
            }

            if (!elementProcessed)
            {
                // Mark and go next.
                if (!elementDepths.has(currentElementId) ||
                    currentDepth < elementDepths.get(currentElementId))
                {
                    elementPaths.set(currentElementId, currentPidPath);
                    elementDepths.set(currentElementId, currentDepth);
                }
                marks.add(currentElementId);
                markedPaths.add(currentPidPath);

                let nextDepth = currentDepth + 1;
                let childrenArcs = currentElement.getChildrenArcs();
                for (let i = 0, l = childrenArcs.length; i < l; ++i) {
                    let arc = childrenArcs[i];
                    queueArcs.push(arc);
                    queueNodes.push(arc.getChild());

                    let sep = '';
                    if (currentPidPath.length > 0 && arc.getArcId()) sep = ';';
                    queuePidPaths.push(currentPidPath + sep + arc.getArcId());

                    if (currentWidPath.length > 0 && currentElementId.length > 0) sep = ';';
                    queueWidPaths.push(currentWidPath + sep + currentElementId);

                    queueDepth.push(nextDepth);
                    queueOtherEnds.push(arc.getParent());
                }
            }
        }

        this.flatGraph = flatGraph;
        return this.flatGraph;
    }

});

export { XGraph, XNode, XArc };
