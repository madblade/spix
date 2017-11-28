/**
 *
 */

'use strict';

/**
 * How to use:
 *
 * // Start with:
 * let s = new Searcher(em, x, y, z);
 * s.initObjects(objects);
 *
 * // Whenever sth. moves:
 * s.updateObjectAxis(object.index);
 *
 */
class Searcher {

    // Fast intern. math. util.
    // No getters/setters.

    constructor(entities, axisX, axisY, axisZ) {
        this.entities = entities;
        this.objectsAxisX = axisX;
        this.objectsAxisY = axisY;
        this.objectsAxisZ = axisZ;
    }

    updateObjectAxis(entityId) {
        let axisX = this.objectsAxisX;
        let axisY = this.objectsAxisY;
        let axisZ = this.objectsAxisZ;

        let objects = this.entities;
        let object = objects[entityId];
        const length = axisX.length;

        const p = object.p0;
        const x = p[0];
        const y = p[1];
        const z = p[2];

        let iXl = object.indexX - 1;
        let iXr = object.indexX + 1;
        let iYl = object.indexY - 1;
        let iYr = object.indexY + 1;
        let iZl = object.indexZ - 1;
        let iZr = object.indexZ + 1;

        let hasSwapped = false;
        let log = /*axis*/() => {
            //console.log('\tswap performed on axis ' + axis);
            hasSwapped = true;
        };

        // Resort left X.
        while (iXl > -1 && objects[axisX[iXl].id].p0[0] > x) {
            log('x-');
            this.swap(axisX, iXl, iXl + 1);
            --iXl;
        }
        // Resort right X.
        while (iXr < length && objects[axisX[iXr].id].p0[0] < x) {
            log('x+');
            this.swap(axisX, iXr, iXr - 1);
            ++iXr;
        }

        // Resort left Y.
        while (iYl > -1 && objects[axisY[iYl].id].p0[1] > y) {
            log('y-');
            this.swap(axisY, iYl, iYl + 1);
            --iYl;
        }
        // Resort right Y.
        while (iYr < length && objects[axisY[iYr].id].p0[1] < y) {
            log('y+');
            this.swap(axisY, iYr, iYr - 1);
            ++iYr;
        }

        // Resort left Z.
        while (iZl > -1 && objects[axisZ[iZl].id].p0[2] > z) {
            log('z-');
            this.swap(axisZ, iZl, iZl + 1);
            --iZl;
        }
        // Resort right Z.
        while (iZr < length && objects[axisZ[iZr].id].p0[2] < z) {
            log('z+');
            this.swap(axisZ, iZr, iZr - 1);
            ++iZr;
        }

        if (hasSwapped) {
            //console.log('Updated object axis for ' + entityId);
            //console.log(this.objectsAxisX);
        }
    }

    static SWP(array, i, j) {
        let t = array[i];
        array[i] = array[j];
        array[j] = t;
        return array;
    }

    // TODO [HIGH] distinguish between 'e' and 'x'
    swap(axisArray, i, j) {
        let objects = this.entities;
        Searcher.SWP(axisArray, i, j);

        if (axisArray === this.objectsAxisX) {
            objects[axisArray[i].id].indexX = i;
            objects[axisArray[j].id].indexX = j;
        }
        else if (axisArray === this.objectsAxisY) {
            objects[axisArray[i].id].indexY = i;
            objects[axisArray[j].id].indexY = j;
        }
        else if (axisArray === this.objectsAxisZ) {
            objects[axisArray[i].id].indexZ = i;
            objects[axisArray[j].id].indexZ = j;
        }
    }

    initObjects(objects) {
        this.entities = objects;

        let axisX = this.objectsAxisX;
        let axisY = this.objectsAxisY;
        let axisZ = this.objectsAxisZ;

        // Init objects order on every axis.
        for (let i = 0; i < objects.length; ++i) {
            axisX[i] = i;
            axisY[i] = i;
            axisZ[i] = i;
        }

        axisX.sort((a, b) => {
            if (objects[a].position[0] < objects[b].position[0]) return -1;
            else if (objects[a].position[0] > objects[b].position[0]) return 1;
            else return 0;
        });

        axisY.sort((a, b) => {
            if (objects[a].position[1] < objects[b].position[1]) return -1;
            else if (objects[a].position[1] > objects[b].position[1]) return 1;
            else return 0;
        });

        axisZ.sort((a, b) => {
            if (objects[a].position[2] < objects[b].position[2]) return -1;
            else if (objects[a].position[2] > objects[b].position[2]) return 1;
            else return 0;
        });

        // Init object indices on every axis.
        let numberOfObjects = objects.length;
        for (let i = 0; i < numberOfObjects; ++i) {
            objects[axisX[i]].indexX = i;
            objects[axisY[i]].indexY = i;
            objects[axisZ[i]].indexZ = i;
        }
    }

    // Works with x axis
    computeIsland(lArray, index) {
        let threshAndIndex = lArray[index];

        let tx = threshAndIndex[0];
        let ty = threshAndIndex[1];
        let tz = threshAndIndex[2];
        let entityIndexX = threshAndIndex[3];
        let xAxisIsland = [entityIndexX];
        let iterator;
        try {
            iterator = new ObjectsIterator(this, entityIndexX, tx, ty, tz);
        } catch (e) {
            return []; // TODO [MEDIUM] bld
        }

        let element = iterator.next();
        // let it = 0;
        // console.log('Begin search.');
        while (element !== null && element !== undefined) {
            let iX = element.indexX;
            // console.log("\tIteration " + (++it) + " resulting in " + iX);
            xAxisIsland.push(iX);
            element = iterator.next();
        }
        // console.log('End search.');

        return xAxisIsland;
    }

}

/**
 * How to use:
 *
 * let iterator = new ObjectsIterator(searcher, object.index, howFarToSearch);
 * while ((let you = iterator.next()) != null) {
 *     // Do stuff with next element (i.e. collide)
 * }
 *
 */
class ObjectsIterator {

    constructor(searcher, objectIndexX, thresholdX, thresholdY, thresholdZ)
    {
        this.axisX = searcher.objectsAxisX;
        this.axisY = searcher.objectsAxisY;
        this.axisZ = searcher.objectsAxisZ;

        this.objects = searcher.entities;

        let objects = this.objects;
        let obj = this.axisX[objectIndexX];
        if (!obj) throw Error('[ObjectsIterator]: invalid initialization.');
        const objectIndex = obj.id;
        this.object = objects[objectIndex];
        let o = this.object;
        this.x = o.p0[0];
        let xW = o.widthX;
        this.y = o.p0[1];
        let yW = o.widthY;
        this.z = o.p0[2];
        let zW = o.widthZ;

        if (objectIndexX !== o.indexX) {
            throw Error('[Searcher] Mismatch between ' +
                'transmitted indexX and the object\'s x index.');
        }

        this.iX = o.indexX;
        this.iY = o.indexY;
        this.iZ = o.indexZ;

        // Others not moving faster than current.
        let abs = Math.abs;
        let maxT = Math.max(abs(thresholdX), abs(thresholdY), abs(thresholdZ));
        this.tx = abs(thresholdX) + maxT + 2 * xW;
        this.ty = abs(thresholdY) + maxT + 2 * yW;
        this.tz = abs(thresholdZ) + maxT + 2 * zW;
        // TODO [HIGH] account for max width when objects are huge.

        this.onX = true;
        this.onY = false;
        this.onZ = false;

        this.step = 1;
        this.stack = 0;
        this.toPlus = true;
        this.done = new Set();
        this.locked = [!1, !1, !1, !1, !1, !1];
    }

    finalize() {
        // console.log("\t\tstack: " + this.stack + ", depth: " + this.step);
        this.step = 1;
        this.stack = 0;
        this.toPlus = true;
        this.onX = true;
        this.onY = false;
        this.onZ = false;
        this.done = new Set();
        // Do not reinit population!
        this.locked = [!1, !1, !1, !1, !1, !1];
    }

    next(indexLocked) {
        this.stack++;
        if (this.stack > 100) {
            console.log(`EXPT: stack ${this.stack}, depth ${this.step}`);
            console.log(this.locked);
            this.finalize();
            throw Error('Exploded stack');
        }
        if (indexLocked % 2 === 0) {
            let l = this.locked;
            if (l[indexLocked] && l[indexLocked + 1]) {
                this.finalize();
                return null;
            }
        }

        let abs = Math.abs;
        let objects = this.objects;
        let axisX = this.axisX;
        let axisY = this.axisY;
        let axisZ = this.axisZ;

        const x = this.x;
        const iX = this.iX;
        const tx = this.tx;
        const y = this.y;
        const iY = this.iY;
        const ty = this.ty;
        const z = this.z;
        const iZ = this.iZ;
        const tz = this.tz;

        const max = axisX.length;

        let s = this.step;
        let onX = this.onX;
        let toPlus = this.toPlus;
        let done = this.done;
        let locked = this.locked;
        let debugObject = id => {
            if (!objects[id]) throw Error(`[Searcher] Couldn\'t find object ${id}`);
        };

        if (done.size >= axisX.length - 1) {
            this.finalize();
            return null;
        }

        // Search on X axis.
        if (onX && toPlus && !locked[0]) {
            //console.log('\t\tx+');
            if (iX + s >= max) {
                locked[0] = true;
                this.toPlus = false;
                return this.next(0);
            }

            // TODO [OPT] replace id with indexX
            let id = axisX[iX + s].id;
            if (done.has(id)) {
                this.toPlus = false;
                return this.next();
            } else done.add(id);

            debugObject(id);
            let object = objects[id];
            if (abs(object.p0[0] - x) <= tx) { // TODO use lfarray instead of tx
                if (abs(object.p0[1] - y) <= ty && abs(object.p0[2] - z) <= tz)
                    return object;
                else {
                    return this.next();
                }
            } else {
                locked[0] = true;
                this.toPlus = false;
                return this.next(0);
            }
        }
        if (onX && !toPlus && !locked[1]) {
            //console.log('\t\tx-');
            if (iX - s < 0) {
                locked[1] = true;
                this.toPlus = true;
                this.onX = false;
                this.onY = true;
                return this.next(0);
            }

            let id = axisX[iX - s].id;
            if (done.has(id)) {
                this.toPlus = true;
                this.onX = false;
                this.onY = true;
                return this.next();
            } else done.add(id);

            debugObject(id);
            let object = objects[id];
            // console.log(x + ',' + object.p0[0] + ' < - > ' + tx);
            if (abs(object.p0[0] - x) <= tx) {
                if (abs(object.p0[1] - y) <= ty && abs(object.p0[2] - z) <= tz)
                    return object;
                else
                    return this.next();
            } else {
                locked[1] = true;
                this.toPlus = true;
                this.onX = false;
                this.onY = true;
                return this.next(0);
            }
        }

        // Search on Y axis.
        let onY = this.onY;
        if (onY && toPlus && !locked[2]) {
            // console.log('\t\ty+');
            if (iY + s >= max) {
                locked[2] = true;
                this.toPlus = false;
                return this.next(2);
            }
            let id = axisY[iY + s].id;
            if (done.has(id)) {
                this.toPlus = false;
                return this.next();
            } else done.add(id);

            debugObject(id);
            let object = objects[id];
            if (abs(object.p0[1] - y) <= ty) {
                if (abs(object.p0[0] - x) <= tx && abs(object.p0[2] - z) <= tz)
                    return object;
                else
                    return this.next();
            } else {
                locked[2] = true;
                this.toPlus = false;
                return this.next(2);
            }
        }
        if (onY && !toPlus && !locked[3]) {
            if (iY - s < 0) {
                locked[3] = true;
                this.toPlus = true;
                this.onY = false;
                this.onZ = true;
                return this.next(2);
            }
            let id = axisY[iY - s].id;
            if (done.has(id)) {
                this.toPlus = true;
                this.onY = false;
                this.onZ = true;
                return this.next();
            } else done.add(id);

            debugObject(id);
            let object = objects[id];
            if (abs(object.p0[1] - y) <= ty) {
                if (abs(object.p0[0] - x) <= tx && abs(object.p0[2] - z) <= tz)
                    return object;
                else
                    return this.next();
            } else {
                locked[3] = true;
                this.toPlus = true;
                this.onY = false;
                this.onZ = true;
                return this.next(2);
            }
        }

        let onZ = this.onZ;
        if (onZ && toPlus && !locked[4]) {
            if (iZ + s >= max) {
                locked[4] = true;
                this.toPlus = false;
                return this.next(4);
            }
            let id = axisZ[iZ + s].id;
            if (done.has(id)) {
                this.toPlus = false;
                return this.next();
            } else done.add(id);

            debugObject(id);
            let object = objects[id];
            if (abs(object.p0[2] - z) <= tz) {
                if (abs(object.p0[0] - x) <= tx && abs(object.p0[1] - y) <= ty)
                    return object;
                else
                    return this.next();
            } else {
                locked[4] = true;
                this.toPlus = false;
                return this.next(4);
            }
        }
        if (onZ && !toPlus && !locked[5]) {
            if (iZ - s < 0) {
                locked[5] = true;
                this.toPlus = true;
                this.onX = true;
                this.onZ = false;
                this.step++;
                return this.next(4);
            }
            let id = axisZ[iZ - s].id;
            if (done.has(id)) {
                this.toPlus = true;
                this.onX = true;
                this.onZ = false;
                this.step++;
                return this.next();
            } else done.add(id);

            debugObject(id);
            let object = objects[id];
            if (abs(object.p0[2] - z) <= tz) {
                if (abs(object.p0[0] - x) <= tx && abs(object.p0[1] - y) <= ty)
                    return object;
                else
                    return this.next();
            } else {
                locked[5] = true;
                this.toPlus = true;
                this.onX = true;
                this.onZ = false;
                this.step++;
                return this.next(4);
            }
        }
    }
}

export default Searcher;
