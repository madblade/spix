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
};

// Node are used for worlds,
// Arcs for portals.
extend(XGraph.prototype, {

    setArc(arcId, arc) {
        if (this.arcs.has(arcId)) console.log('XGraph: adding an existing arc to the graph.');
        this.arcs.set(arcId, arc);
    },

    insertNode: function(newArcId, newNodeId, parentNodeId) {
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

                console.log('FOUND ROOT');
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

    // Compute a graph representation, starting from the root. Custom BFS.
    toString: function() {
        var string = '';
        var currentElement, currentElementId, currentArc, currentArcId, currentOtherEnd;
        var marks = new Set(); // Verification.
        var queueNodes = [this.root];
        var queueOtherEnds = [null];

        var currentDepth = 0;
        var queueDepth = [currentDepth];
        var queueArcs = [null];
        var elementDepths = new Map();
        var processed = false;

        // BFS.
        while (queueNodes.length > 0) {
            currentElement = queueNodes.pop();
            currentDepth = queueDepth.pop();
            currentArc = queueArcs.pop();
            currentOtherEnd = queueOtherEnds.pop();
            currentElementId = currentElement.getNodeId();

            if (currentArc) {
                currentArcId = currentArc.getArcId();

                var modifier = '';
                processed = marks.has(currentElementId);
                if (processed) {
                    var formerDepth = elementDepths.get(currentElementId);
                    if (formerDepth === currentDepth - 2) { modifier = 'cyan'; }
                    else if (formerDepth < currentDepth - 2) { modifier = 'red'; }
                    else if (formerDepth >= currentDepth - 1) { modifier = 'orange'; }
                } else { modifier = 'lime'; }

                var offset = '';
                for (var o = 0; o<currentDepth; ++o) {
                    if (o === currentDepth - 1) {
                        if (queueDepth.indexOf(currentDepth) > -1) {
                            offset+='├';
                        } else {
                            offset+='└';
                        }
                        offset+='─';
                    } else {
                        if (queueDepth.indexOf(o) > -1) {
                            offset+='|';
                        } else {
                            if (queueDepth.indexOf(o+1) > -1) {
                                offset+='\u00a0|\u00a0';
                            } else {
                                offset+='\u00a0\u00a0\u00a0';
                            }
                        }
                    }
                }
                if (string.length > 1) string += '\n';
                var origin = '';
                if (currentOtherEnd) origin += 'w.' + currentOtherEnd.getNodeId()+'...';
                string += offset + modifier + ' ' + origin + 'w.{' + currentElementId + '} p.' + currentArcId;
            }

            if (!processed) {
                // Mark and go next.
                elementDepths.set(currentElementId, currentDepth);
                marks.add(currentElementId);
                var nextDepth = currentDepth + 1;
                var childrenArcs = currentElement.getChildrenArcs();
                for (var i = 0, l = childrenArcs.length; i < l; ++i) {
                    var arc = childrenArcs[i];
                    queueArcs.push(arc);
                    queueNodes.push(arc.getChild());
                    queueDepth.push(nextDepth);
                    queueOtherEnds.push(arc.getParent());
                }
            }
        }

        return string;
    }

});
