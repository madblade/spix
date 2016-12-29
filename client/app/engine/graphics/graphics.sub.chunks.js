/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.initializeChunk = function(chunkId, all, chunkSizeX, chunkSizeY, chunkSizeZ)
{
    // TODO don't discriminate components
    // TODO discriminate components server-side
    var components = all[0];
    var natures = all[1];

    var currentComponent;
    var currentNatures;
    for (var cid in components) {
        currentComponent = components[cid];
        currentNatures = natures[cid];
        break;
    }

    if (!currentComponent) {
        console.log('Warn: missed an update'); return;
    }

    var chunkIndices = chunkId.split(',');
    var chunkI = parseInt(chunkIndices[0]); var iChunkOffset = chunkI * chunkSizeX;
    var chunkJ = parseInt(chunkIndices[1]); var jChunkOffset = chunkJ * chunkSizeY;
    var chunkK = parseInt(chunkIndices[2]); var kChunkOffset = chunkK * chunkSizeZ;

    var iS = chunkSizeX;
    var ijS = chunkSizeX * chunkSizeY;
    var ijkS = ijS * chunkSizeZ;

    var triangles = 2 * currentComponent.length;
    var sunCapacity = Math.floor(3/2 * triangles);
    sunCapacity += (sunCapacity%2); // Make it pair
    if (this.debug) console.log('On chunk ' + chunkId + ', init geometry will be ' + sunCapacity * 3 * 3 + '-capable.');

    var positions = new Float32Array(sunCapacity * 3 * 3);
    var normals = new Float32Array(sunCapacity * 3 * 3);
    var colors = new Float32Array(sunCapacity * 3 * 3);
    var uvs = new Float32Array(sunCapacity * 3 * 2);

    var pA = new THREE.Vector3(); var pB = new THREE.Vector3();
    var pC = new THREE.Vector3(); var cb = new THREE.Vector3();
    var ab = new THREE.Vector3(); var color = new THREE.Color();

    var whereToFindFace = new Map();
    var whichFaceIs = new Map();

    var i = 0;
    for (var f = 0; f < currentComponent.length; ++f) {
        var faceId = Math.abs(currentComponent[f]);

        whereToFindFace.set(faceId, [0, f]); // [In which geometry a given face is, at which position]
        var wf0 = whichFaceIs.get(0);
        if (wf0 === undefined) {
            wf0 = new Map();
            whichFaceIs.set(0, wf0);
        }
        wf0.set(f, faceId);

        var normal = currentNatures[f] > 0;

        this.addFace(faceId, i, iS, ijS, ijkS,
            positions, normals, colors, uvs, Math.abs(currentNatures[f]),
            iChunkOffset, jChunkOffset, kChunkOffset,
            pA, pB, pC, cb, ab,
            normal, color);

        i += 18;
    }

    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.computeBoundingSphere();

    var material = this.createMaterial('textured-phong', 0xaaaaaa);

    return {
        'geometries':       [geometry],
        'materials':        [material],
        'meshes':           [new THREE.Mesh(geometry, material)],

        'capacities':       [sunCapacity/2],
        'sizes':            [triangles/2],

        'whereToFindFace':  whereToFindFace,
        'whichFaceIs':      whichFaceIs
    };
};


App.Engine.Graphics.prototype.updateChunk = function(chunk, chunkId, components, chunkSizeX, chunkSizeY, chunkSizeZ)
{

    var geometries =        chunk.geometries;
    var materials =         chunk.materials;
    var meshes =            chunk.meshes;
    var capacities =        chunk.capacities;
    var sizes =             chunk.sizes;
    var whereToFindFace =   chunk.whereToFindFace;
    var whichFaceIs =       chunk.whichFaceIs;

    var removed =   components[0];
    var added =     components[1];
    var updated =   components[2];

    this.removeChunkFaces(removed, geometries, materials, meshes, capacities, sizes, whereToFindFace, whichFaceIs);

    this.addChunkFaces(added, geometries, materials, meshes, capacities, sizes, whereToFindFace, whichFaceIs,
        chunkId, chunkSizeX, chunkSizeY, chunkSizeZ);

    this.updateChunkFaces(updated, geometries);
};

App.Engine.Graphics.prototype.removeChunkFaces = function(removed,
                                                          geometries, materials, meshes, capacities, sizes,
                                                          whereToFindFace, whichFaceIs)
{

    var geometry, vertices, colors, normals, uvs;
    var meshId;

    for (var rid in removed) {
        rid = parseInt(rid);
        // Get graphic data
        if (!whereToFindFace.has(rid)) {
            console.log("Trying to remove a face that is not present in chunk: " + rid);
            continue;
        }

        var wtffrid = whereToFindFace.get(rid);
        meshId = wtffrid[0];
        var position = wtffrid[1];

        geometry = geometries[meshId];

        vertices =  geometry.attributes.position.array;
        colors =    geometry.attributes.color.array;
        normals =   geometry.attributes.normal.array;
        uvs =       geometry.attributes.uv.array;
        var lastPosition = sizes[meshId] - 1;
        var isLast = lastPosition === position;

        // Update
        var i, p;
        if (isLast) {
            for (i = 0; i<18; ++i) {
                p = 18 * position + i;
                // Delete current
                vertices[p] = normals[p] = colors[p] = 0;
            }
            for (i = 0; i<12; ++i) {
                uvs[12 * position + i] = 0;
            }
        } else {
            for (i = 0; i<18; ++i) {
                p = 18 * position + i;
                // Swap current with last
                var lp = 18 * lastPosition + i;
                vertices[p] = vertices[lp];
                normals[p]  = normals[lp];
                colors[p]   = colors[lp];
                // Delete last
                vertices[lp] = normals[lp] = colors[lp] = 0;
            }
            for (i = 0; i<12; ++i) {
                p = 12 * position + i;
                var lp1 = 12 * lastPosition + i;
                uvs[p] = uvs[lp1];
                uvs[lp1] = 0;
            }
        }

        // Update helpers (swap last if applicable).
        if (!isLast) {
            var whichFaceIsMeshId = whichFaceIs.get(meshId);
            if (whichFaceIsMeshId.get(lastPosition) === undefined) {
                console.log("WARN: swapping");
                console.log(whichFaceIs[meshId][lastPosition] + " @mesh " + meshId + " @lastposition " +
                    lastPosition + " @position " + position);
            }

            whereToFindFace.set(whichFaceIsMeshId.get(lastPosition), [meshId, position]);
            whichFaceIsMeshId.set(position, whichFaceIsMeshId.get(lastPosition));
        }

        whichFaceIs.get(meshId).delete(lastPosition);
        whereToFindFace.delete(rid);
        sizes[meshId] -= 1;

        // Delete geometry if applicable.
        if (sizes[meshId] === 0) {
            console.log("INFO: geometry deletion.");
            // Remove mesh from scene.
            this.sceneManager.removeFromScene(meshes[meshId]); // TODO [CRIT] knotify
            geometries[meshId]  = undefined;
            materials[meshId]   = undefined;
            meshes[meshId]      = undefined;
            sizes[meshId]       = undefined;
            capacities[meshId]  = undefined;
            whichFaceIs.delete(meshId);

        } else {
            // Notify object
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.color.needsUpdate = true;
            geometry.attributes.normal.needsUpdate = true;
            geometry.attributes.uv.needsUpdate = true;
            geometry.computeBoundingSphere();
        }
    }
};

App.Engine.Graphics.prototype.addChunkFaces = function(added,
                                                       geometries, materials, meshes, capacities, sizes,
                                                       whereToFindFace, whichFaceIs,
                                                       chunkId, chunkSizeX, chunkSizeY, chunkSizeZ)
{

    var geometry, vertices, colors, normals, uvs;
    var meshId, faceId;

    var iS = chunkSizeX;
    var ijS = chunkSizeX * chunkSizeY;
    var ijkS = ijS * chunkSizeZ;

    var chunkIndices = chunkId.split(',');
    var chunkI = parseInt(chunkIndices[0]); var iChunkOffset = chunkI * chunkSizeX;
    var chunkJ = parseInt(chunkIndices[1]); var jChunkOffset = chunkJ * chunkSizeY;
    var chunkK = parseInt(chunkIndices[2]); var kChunkOffset = chunkK * chunkSizeZ;
    var defaultGeometrySize = this.defaultGeometrySize;

    for (var aid in added) {
        aid = parseInt(aid);

        // Get graphic data
        faceId = Math.abs(aid);
        if (whereToFindFace.hasOwnProperty(faceId)) {
            console.log("Trying to add a face that is already present in chunk.");
            continue;
        }

        // Compute mesh id.
        meshId = 0;
        var meshHasToBeAdded = false;
        while (sizes[meshId] !== undefined && sizes[meshId] === capacities[meshId]) ++meshId;

        // Add new mesh if necessary.
        meshHasToBeAdded = sizes[meshId] === undefined;

        if (this.debug) {
            var progress = Math.floor((sizes[meshId] / capacities[meshId]) * 100);
            if (progress % 20 === 0) console.log("INFO: Geometry " + meshId + " at " + progress + "% capacity.");
        }

        if (meshHasToBeAdded) {
            if (this.debug) {
                console.log("INFO: Geometry addition: " +
                    meshId + (meshId%10===1?"st":meshId%10===2?"nd":meshId%10===3?"rd":"th") + " geometry.");
            }

            // Create geometry.
            geometry = new THREE.BufferGeometry();
            geometries[meshId] = geometry;
            materials[meshId] = this.createMaterial('textured-phong', 0xb8860b);
            sizes[meshId] = 1;
            whichFaceIs.set(meshId, new Map());

            var triangles = 2 * defaultGeometrySize;
            var sunCapacity = Math.floor(3/2 * triangles);
            capacities[meshId] = sunCapacity / 2;

            vertices = new Float32Array(sunCapacity * 3 * 3);
            normals = new Float32Array(sunCapacity * 3 * 3);
            colors = new Float32Array(sunCapacity * 3 * 3);
            uvs = new Float32Array(sunCapacity * 3 * 2);

            if (this.debug) {
                console.log("New capacity will be " + sunCapacity * 3 * 3 + ".");
            }
        } else {
            geometry = geometries[meshId];
            sizes[meshId] += 1;
            vertices =  geometry.attributes.position.array;
            colors =    geometry.attributes.color.array;
            normals =   geometry.attributes.normal.array;
            uvs =       geometry.attributes.uv.array;
        }

        // Add face.
        var pA = new THREE.Vector3();
        var pB = new THREE.Vector3();
        var pC = new THREE.Vector3();
        var cb = new THREE.Vector3();
        var ab = new THREE.Vector3();
        var n = 800;
        var color = new THREE.Color();
        var pos = sizes[meshId] - 1;

        var nature = added[aid]; // Corresponds to block id.
        var normal = nature > 0;
        whereToFindFace.set(aid, [meshId, pos]);
        whichFaceIs.get(meshId).set(pos, aid);

        this.addFace(faceId, pos * 18, iS, ijS, ijkS,
            vertices, normals, colors, uvs, Math.abs(nature),
            iChunkOffset, jChunkOffset, kChunkOffset,
            pA, pB, pC, cb, ab,
            normal, color, n);

        if (meshHasToBeAdded) {
            geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
            geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));

            meshes[meshId] = new THREE.Mesh(geometry, materials[meshId]);
            this.addToScene(meshes[meshId], -1); // TODO [CRIT] couple with knot model.
        }

        // Notify object.
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
        geometry.attributes.normal.needsUpdate = true;
        geometry.attributes.uv.needsUpdate = true;
        geometry.computeBoundingSphere();
    }
};

// TODO [LONG-TERM] manage changes
App.Engine.Graphics.prototype.updateChunkFaces = function(updated, geometries) {
    for (var uid in updated) {
    }
};
