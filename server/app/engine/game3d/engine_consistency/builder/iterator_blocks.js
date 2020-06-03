/**
 *
 */

'use strict';

class BlockIterator
{
    constructor(/*chunk*/) {
        // this._dimensions = chunk.dimensions;
        this._currentFace = null;
    }

    set currentFace(newCurrentFace) {
        this._currentFace = newCurrentFace;
    }

    nextFace() {

    }

    static breadthFirstSearch() {
        let queue = [];
        // let startingFace = this._currentFace;
        // let marks = {};
        queue.shift();

        /*
        while (!stack.isEmpty()) {
            currentDart = stack.pop();
            betas = currentDart.getBetas();
            for (Dart betaI : betas) {
                if (betaI == null || betaI.isMarked()) continue;
                betaI.mark();
                stack.push(betaI);
            }
        }
        */
    }
}

export default BlockIterator;
