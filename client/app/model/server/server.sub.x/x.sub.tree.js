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

    addExistingChild: function(arcId, node) {
        var arc = new XArc(this, node, arcId);
        node.parentArcs.push(arc);
        this.childrenArcs.push(arc);
        return node;
    },

    addNewChild: function(arcId, nodeId) {
        var node = new XNode(nodeId);
        var arc = new XArc(this, node, arcId);
        node.parentArcs.push(arc);
        this.childrenArcs.push(arc);
        return node;
    },

    getParentArcId: function() {
        if (this.parentArcs === null) throw('Root has no parent.');
        return this.parentArcs.getArcId();
    },

    getChildrenArcs: function() {
        return this.childrenArcs;
    },

    forEachChild: function(callback) {
        this.childrenArcs.forEach(function(arc) {
            callback(arc);
        });
    },

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
    this.nodes.set(rootId, this.root);
};

extend(XGraph.prototype, {

    insertNode: function(newArcId, newNodeId, parentNodeId) {
        var node = this.nodes.get(parentNodeId);
        if (!node) {
            node = new XNode(parentNodeId, null);
            this.nodes.set(parentNodeId, node);
        }

        var newNode = this.nodes.get(newNodeId);
        if (newNode) {
            node.addExistingChild(newArcId, newNode);
        } else {
            newNode = node.addNewChild(newArcId, newNodeId);
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

        // DFS.
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
                    if (formerDepth === currentDepth-2) { modifier = 'cyan'; }
                    else if (formerDepth < currentDepth) { modifier = 'red'; }
                    else if (formerDepth === currentDepth) { modifier = 'orange'; }
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
