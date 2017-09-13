/**
 *
 */

'use strict';

var XNode;
var XArc;
var XGraph;

XNode = function(nodeId, parentArc) {
    this.nodeId = nodeId;
    if (parentArc) {
        this.parentArcs = [parentArc];
    } else {
        this.parentArcs = [];
    }
    this.childrenArcs = [];
};

extend(XNode.prototype, {

    getNodeId: function() {
        return this.nodeId;
    },

    getNumberOfChildren: function() {
        return this.childrenArcs.length;
    },

    addExistingChild: function(arcId, node, xgraph) {
        var arc = new XArc(this, node, arcId);
        xgraph.setArc(arcId, this);
        node.parentArcs.push(arc);
        this.childrenArcs.push(arc);
        return node;
    },

    addNewChild: function(arcId, nodeId, xgraph) {
        var node = new XNode(nodeId);
        var arc = new XArc(this, node, arcId);
        xgraph.setArc(arcId, arc);
        node.parentArcs.push(arc);
        this.childrenArcs.push(arc);
        return node;
    },

    getParentArcs: function() {
        if (this.parentArcs === null) throw('Root has no parent.');
        return this.parentArcs;
    },

    getChildrenArcs: function() {
        return this.childrenArcs;
    },

    forEachChild: function(callback) {
        this.childrenArcs.forEach(function(arc) {
            callback(arc);
        });
    }

});

XArc = function(parentNode, childNode, arcId) {
    this.arcId = arcId;
    this.parentNode = parentNode;
    this.childNode = childNode;
};

extend(XArc.prototype, {

    getChild: function() {
        return this.childNode;
    },

    getParent: function() {
        return this.parentNode;
    },

    getArcId: function() {
        return this.arcId;
    }

});

XGraph = function(rootId) {
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

    setArc: function(arcId, arc) {
        if (this.arcs.has(arcId)) console.log('XGraph: adding an existing arc to the graph.');
        this.arcs.set(arcId, arc);
    },

    insertNode: function(newArcId, forwardArcId, newNodeId, parentNodeId) {
        newArcId = newArcId + ',' + forwardArcId;

        var node = this.nodes.get(parentNodeId);
        if (!node) {
            node = new XNode(parentNodeId, null);
            this.nodes.set(parentNodeId, node);
        }

        var newNode = this.nodes.get(newNodeId);
        if (newNode) {
            // N.B. graph passed to add arc to model
            node.addExistingChild(newArcId, newNode, this);
        } else {
            newNode = node.addNewChild(newArcId, newNodeId, this);
            this.nodes.set(newNodeId, newNode);
        }

        return newNode;
    },

    hasNode: function(nodeId) {
        return this.nodes.has(nodeId);
    },

    getNode: function(nodeId) {
        return this.nodes.get(nodeId);
    },

    switchRoot: function(oldRootId, newRootId) {
        // Allow only 1-length switch at a time.
        var oldRoot = this.root;
        if (oldRoot.getNodeId() !== oldRootId) {
            console.log('XGraph Error: trying to switch from invalid root.');
            return;
        }

        var children = oldRoot.getChildrenArcs();
        if (!children) return; // No other world.

        var currentArc, currentNode, currentNodeId;
        for (var cid = 0, nbc = children.length; cid < nbc; ++cid) {
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
    applyFromPosition: function(starterArcId, deepestArcId, callback) {
        var starterNode = this.root;
        if (starterArcId) {
            var starterArc = this.arcs.get(starterArcId);
            if (!starterArc) { console.log('Error at XGraph: starter arc not found.'); return; }
            starterNode = starterArc.getChild();
        }

        var arcMarkers = new Set();
        var nodeMarkers = new Map();
        nodeMarkers.set(starterNode.getNodeId(), 0); // node id, depth

        var stack = [];
        var paths = []; // Arc paths. Nodes are easily deduced.
        var depths = [];

        var starterArcs = starterNode.childrenArcs;
        if (!starterArcs) { console.log('XGraph: no arc found.'); return; }
        starterArcs.forEach(function(arc) {
            stack.push(arc);
            paths.push('' + arc.getArcId());
            depths.push(1);
        });

        var maxDepth = Number.POSITIVE_INFINITY;

        var head, depth, path;
        while (stack.length > 0) {
            // Get current element.
            head = stack.pop();
            path = paths.pop();
            depth = depths.pop();

            var currentId = head.getArcId();
            arcMarkers.add(currentId);
            if (currentId === deepestArcId) {
                maxDepth = depth;
            }

            var childNode = head.getChild();
            if (childNode && nodeMarkers.get(childNode.getNodeId()) < depth) continue;

            // Do callback.
            callback(head, path, depth);

            // Prepare next elements.
            var newDepth = depth + 1;
            if (newDepth > maxDepth) continue;
            // No other arc to process?
            if (!childNode) continue;
            // Node was already processed?
            var testNodeId = childNode.getNodeId();
            var testRecursedNode = nodeMarkers.get(testNodeId);
            if (testRecursedNode < newDepth) {
                // Here, node was already encountered,
                // so it is marked to avoid 1-step recursion.
                continue;
            }
            nodeMarkers.set(testNodeId, newDepth);

            var childrenArcs = childNode.getChildrenArcs();
            for (var i = 0, l = childrenArcs.length; i < l; ++i) {
                var arc = childrenArcs[i];

                var addedArcId = arc.getArcId();
                if (!arcMarkers.has(addedArcId)) {
                    stack.push(arc);
                    depths.push(newDepth);
                    paths.push(path + ',' + addedArcId);
                }
            }
        }

    },

    toString: function() {
        var string = '';
        var flatGraph = this.flatGraph;

        var currentStep;
        for (var i = 0, l = flatGraph.length; i < l; ++i) {
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

            var dep = currentStep.depth;
            var mod = currentStep.type;
            var por = currentStep.pid;
            var ori = currentStep.origin;
            var ele = currentStep.destination;
            var pat = currentStep.path;
            var wpt = currentStep.wpath;

            for (var j = 0, d = dep; j < d; ++j) string += '\u00a0\u00a0\u00a0';
            string += mod + ' w.' + ori + 'w.{' + ele + '} p.' + por + ' // ' + pat + '|' + wpt;
            string += '\n';
        }

        return string;
    },
    
    computeCameraTransform: function(pidPath, portals, cameraManager) {
        var root = cameraManager.mainCamera;
        var cameraTransform = [
            0, 0, 0, // Position
            0, 0, 0  // Rotation
        ];
        
        for (var pathId = 0, pathLength = pidPath.length; pathId < pathLength; ++pathId) {
            var currentPid = parseInt(pidPath[pathId][0]);
            var currentP = portals.get(currentPid);
            
            // TODO [CRIT] compute transform
        }  
        
        return cameraTransform;
    },

    // Add cameras and everything and so on.
    computeRenderingGraph: function(graphicsEngine, xModel) {
        var flatGraph = this.flatGraph;
        if (flatGraph.length < 1) return;
        graphicsEngine.flushPortalUpdates();

        var cameraManager = graphicsEngine.cameraManager;
        var worldToPortals = xModel.worldToPortals;

        var portals = xModel.portals; // Fixed by xModel
    
        var currentStep, originWid, destinationWid, originPid, destinationPid;
        var widPath, pidPathString, pidPath, depth;
        var cameraTransform;
        for (var i = 0, l = flatGraph.length; i < l; ++i) {
            currentStep = flatGraph[i];
            originWid       = currentStep.origin;
            destinationWid  = currentStep.destination;
            originPid       = parseInt(currentStep.pid.split(',')[0]);
            destinationPid  = parseInt(currentStep.pid.split(',')[1]);
            pidPathString   = currentStep.path;
            pidPath         = pidPathString.split(';');
            widPath         = currentStep.wpath.split(';');
            depth           = currentStep.depth;

            switch (currentStep.type) {
                
                case 'lime': // Regular.
                    // Add screen.
                    // Add camera.
                    // Add path to camera.
                    var p1 = portals.get(originPid);
                    var p2 = portals.get(destinationPid);
                    if (!p1 || !p2) {
                        console.log('Problem while adding portal ' + originPid + ' / ' + destinationPid);
                        console.log('Origin: ' + p1 + ', Destination ' + p2); continue;
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
    computeFlatGraph: function() {
        var flatGraph = [];
        var currentStep;

        var currentElement, currentElementId, currentArc, currentArcId, currentOtherEnd;
        var currentPidPath, currentWidPath;
        var marks = new Set(); // Verification.
        var markedPaths = new Set();
        var queueNodes = [this.root];
        var queueOtherEnds = [null];

        var currentDepth = 0;
        var queueWidPaths = [''];
        var queuePidPaths = [''];
        var queueDepth = [currentDepth];
        var queueArcs = [null];
        var elementDepths = new Map();
        var elementPaths = new Map();
        var elementProcessed = false;

        // DFS.
        while (queueNodes.length > 0) {
            currentElement = queueNodes.pop();
            currentDepth = queueDepth.pop();
            currentArc = queueArcs.pop();
            currentPidPath = queuePidPaths.pop();
            currentWidPath = queueWidPaths.pop();
            currentOtherEnd = queueOtherEnds.pop();
            currentElementId = currentElement.getNodeId();

            elementProcessed = marks.has(currentElementId);
            //
            var b = currentPidPath.split(';');
            var c = b.pop().split(',').reverse(); b.pop(); b.push(c);
            var directInvolutionPath = b.join(';');
            //
            var e = currentPidPath.split(';'); e.pop(); e.join(';');
            var widArray = currentWidPath.split(';');

            if (currentArc) {
                currentArcId = currentArc.getArcId();
                currentStep = {};

                // Detect direct 0-involutions
                if (elementProcessed && currentOtherEnd && currentOtherEnd.getNodeId() === currentElementId) {
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
                // TODO [HIGH] check. I guess an arc has always a parent and a child.
                currentStep.origin = currentOtherEnd.getNodeId();
                currentStep.destination = currentElementId;
                currentStep.pid = currentArcId;
                currentStep.path = currentPidPath; // Without the last pid.
                currentStep.wpath = currentWidPath; // Without the last wid.

                flatGraph.push(currentStep);
            }

            if (!elementProcessed) {
                // Mark and go next.
                if (!elementDepths.has(currentElementId) || currentDepth < elementDepths.get(currentElementId)) {
                    elementPaths.set(currentElementId, currentPidPath);
                    elementDepths.set(currentElementId, currentDepth);
                }
                marks.add(currentElementId);
                markedPaths.add(currentPidPath);

                var nextDepth = currentDepth + 1;
                var childrenArcs = currentElement.getChildrenArcs();
                for (var i = 0, l = childrenArcs.length; i < l; ++i) {
                    var arc = childrenArcs[i];
                    queueArcs.push(arc);
                    queueNodes.push(arc.getChild());

                    var sep = '';
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
        return this;
    }

});
