/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.isChunkLoaded = function(chunkId) {
    return this.chunks.hasOwnProperty(chunkId);
};

App.Engine.Graphics.prototype.initChunk = function(chunkId, all) {
    this.chunks[chunkId] = {};
    var c = this.chunks[chunkId];
    c.geometries = [new THREE.BufferGeometry()];
    c.whereToFindFace = {};
    c.whichFaceIs = {};

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
        console.log('Warn: missed an update');
        return;
    }

    var chunkIndices = chunkId.split(',');
    var chunkI = parseInt(chunkIndices[0]);
    var chunkJ = parseInt(chunkIndices[1]);
    var chunkK = parseInt(chunkIndices[2]);

    var iChunkOffset = chunkI * this.chunkSizeX;
    var jChunkOffset = chunkJ * this.chunkSizeY;
    var kChunkOffset = chunkK * this.chunkSizeZ;

    var ijkS = this.chunkCapacity;
    var ijS = this.chunkSizeX * this.chunkSizeY;
    var iS = this.chunkSizeX;
    var triangles = 2 * currentComponent.length;
    var sunCapacity = Math.floor(3/2 * triangles);
    sunCapacity += (sunCapacity%2); // Make it pair
    c.capacities = [sunCapacity/2];
    c.sizes = [triangles/2];

    var positions = new Float32Array(sunCapacity * 3 * 3);
    var normals = new Float32Array(sunCapacity * 3 * 3);
    var colors = new Float32Array(sunCapacity * 3 * 3);
    var uvs = new Float32Array(sunCapacity * 3 * 2);
    /*var quad_uvs = [
            0.0, 0.0,
            0.1, 0.0,
            0.1, 0.1,
            0.0, 0.1 ];
    for (var id = 0; id<sunCapacity; ++id) {
        uvs[id] = quad_uvs[id%8];
    }*/

    if (this.settings.debug)
        console.log('On chunk ' + chunkId + ', the initial geometry will be ' + sunCapacity * 3 * 3 + '-capable.');

    var pA = new THREE.Vector3();
    var pB = new THREE.Vector3();
    var pC = new THREE.Vector3();
    var cb = new THREE.Vector3();
    var ab = new THREE.Vector3();
    var n = 800;
    var color = new THREE.Color();

    var i = 0;
    for (var f = 0; f < currentComponent.length; ++f) {
        var faceId = Math.abs(currentComponent[f]);
        c.whereToFindFace[faceId] = [0, f]; // [In which geometry a given face is, at which position]
        c.whichFaceIs[0] = c.whichFaceIs[0] || {};
        c.whichFaceIs[0][f] = faceId;
        var normal = currentNatures[f] > 0;

        this.addFace(faceId, i, iS, ijS, ijkS,
            positions, normals, colors, uvs, Math.abs(currentNatures[f]),
            iChunkOffset, jChunkOffset, kChunkOffset,
            pA, pB, pC, cb, ab,
            normal, color, n);

        i += 18;
    }

    c.geometries[0].addAttribute('position', new THREE.BufferAttribute(positions, 3));
    c.geometries[0].addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    c.geometries[0].addAttribute('color', new THREE.BufferAttribute(colors, 3));
    c.geometries[0].addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    c.geometries[0].computeBoundingSphere();

    // Make material and mesh.
    c.materials = [new THREE.MeshPhongMaterial({
        color: 0xaaaaaa, specular: 0xffffff, shininess: 250,
        side: THREE.BackSide,
        map: this.texture
        // vertexColors: THREE.VertexColors
    })];
    c.meshes = [new THREE.Mesh(c.geometries[0], c.materials[0])];

    // Add to scene.
    this.scene.add(c.meshes[0]);
};

App.Engine.Graphics.prototype.updateChunk = function(chunkId, components) {
    var c = this.chunks[chunkId];

    var geometries = c.geometries;
    var whereToFindFace = c.whereToFindFace;
    var whichFaceIs = c.whichFaceIs;
    var meshes = c.meshes;
    var materials = c.materials;
    var capacities = c.capacities;
    var sizes = c.sizes;

    var vertices, colors, normals, uvs;
    var ijkS = this.chunkCapacity;
    var ijS = this.chunkSizeX * this.chunkSizeY;
    var iS = this.chunkSizeX;
    var chunkIndices = chunkId.split(',');

    var chunkI = parseInt(chunkIndices[0]);
    var chunkJ = parseInt(chunkIndices[1]);
    var chunkK = parseInt(chunkIndices[2]);
    var iChunkOffset = chunkI * this.chunkSizeX;
    var jChunkOffset = chunkJ * this.chunkSizeY;
    var kChunkOffset = chunkK * this.chunkSizeZ;

    var defaultGeometrySize = this.defaultGeometrySize;

    var meshId;
    var removed = components[0];
    var faceId;

    for (var rid in removed) {
        // Get graphic data
        if (!whereToFindFace.hasOwnProperty(rid)) {
            console.log("Trying to remove a face that is not present in chunk.");
            continue;
        }

        meshId = whereToFindFace[rid][0];
        var position = whereToFindFace[rid][1];

        vertices = geometries[meshId].attributes.position.array;
        colors = geometries[meshId].attributes.color.array;
        normals = geometries[meshId].attributes.normal.array;
        uvs = geometries[meshId].attributes.uv.array;
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
                normals[p] = normals[lp];
                colors[p] = colors[lp];
                // Delete last
                vertices[lp] = normals[lp] = colors[lp] = 0;
            }
            for (i = 0; i<12; ++i) {
                p = 12 * position + i;
                var lp = 12 * lastPosition + i;
                uvs[p] = uvs[lp];
                uvs[lp] = 0;
            }
        }

        // Update helpers (swap last if applicable).
        if (!isLast) {
            if (whichFaceIs[meshId][lastPosition] === undefined) {
                console.log("WARN: swapping");
                console.log(whichFaceIs[meshId][lastPosition] + " @mesh " + meshId + " @lastposition " + lastPosition + " @position " + position);
            }

            whereToFindFace[whichFaceIs[meshId][lastPosition]] = [meshId, position];
            whichFaceIs[meshId][position] = whichFaceIs[meshId][lastPosition];
        }
        delete whichFaceIs[meshId][lastPosition];
        delete whereToFindFace[rid];
        sizes[meshId] -= 1;

        // Delete geometry if applicable.
        if (sizes[meshId] === 0) {
            console.log("INFO: geometry deletion.");
            // Remove mesh from scene.
            this.scene.remove(meshes[meshId]);
            delete sizes[meshId];
            delete capacities[meshId];
            delete geometries[meshId];
            delete materials[meshId];
            delete meshes[meshId];
            delete whichFaceIs[meshId];

        } else {
            // Notify object
            geometries[meshId].attributes.position.needsUpdate = true;
            geometries[meshId].attributes.color.needsUpdate = true;
            geometries[meshId].attributes.normal.needsUpdate = true;
            geometries[meshId].attributes.uv.needsUpdate = true;
            geometries[meshId].computeBoundingSphere();
        }
    }

    var added = components[1];
    for (var aid in added) {
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

        var progress = Math.floor((sizes[meshId] / capacities[meshId]) * 100);
        if  (progress % 20 === 0) console.log("INFO: Geometry " + meshId + " at " + progress + "% capacity.");
        if (meshHasToBeAdded) {
            console.log("INFO: Geometry addition: " +
                meshId + (meshId%10===1?"st":meshId%10===2?"nd":meshId%10===3?"rd":"th") + " geometry.");

            // Create geometry.
            geometries[meshId] = new THREE.BufferGeometry();
            materials[meshId] = new THREE.MeshPhongMaterial({
                color: 0xb8860b, specular: 0xffffff, shininess: 250,
                side: THREE.BackSide,
                // vertexColors: THREE.VertexColors
                map: this.texture
            });
            sizes[meshId] = 1;
            whichFaceIs[meshId] = {};

            var triangles = 2 * defaultGeometrySize;
            var sunCapacity = Math.floor(3/2 * triangles);
            capacities[meshId] = sunCapacity / 2;

            vertices = new Float32Array(sunCapacity * 3 * 3);
            normals = new Float32Array(sunCapacity * 3 * 3);
            colors = new Float32Array(sunCapacity * 3 * 3);
            uvs = new Float32Array(sunCapacity * 3 * 2);

            console.log("New capacity will be " + sunCapacity * 3 * 3 + ".");
        } else {
            sizes[meshId] += 1;
            vertices = geometries[meshId].attributes.position.array;
            colors = geometries[meshId].attributes.color.array;
            normals = geometries[meshId].attributes.normal.array;
            uvs = geometries[meshId].attributes.uv.array;
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
        whereToFindFace[aid] = [meshId, pos];
        whichFaceIs[meshId][pos] = aid;

        this.addFace(faceId, pos * 18, iS, ijS, ijkS,
            vertices, normals, colors, uvs, Math.abs(nature),
            iChunkOffset, jChunkOffset, kChunkOffset,
            pA, pB, pC, cb, ab,
            normal, color, n);

        if (meshHasToBeAdded) {
            geometries[meshId].addAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometries[meshId].addAttribute('normal', new THREE.BufferAttribute(normals, 3));
            geometries[meshId].addAttribute('color', new THREE.BufferAttribute(colors, 3));

            meshes[meshId] = new THREE.Mesh(geometries[meshId], materials[meshId]);
            this.scene.add(meshes[meshId]);
        }

        // Notify object.
        geometries[meshId].attributes.position.needsUpdate = true;
        geometries[meshId].attributes.color.needsUpdate = true;
        geometries[meshId].attributes.normal.needsUpdate = true;
        geometries[meshId].computeBoundingSphere();
    }

    var updated = components[2];
    for (var uid in updated) {
        // TODO manage changes
    }
};

// TODO dynamically remove chunks with GreyZone
App.Engine.Graphics.prototype.removeChunk = function(chunkId) {
    var meshes = this.chunks[chunkId].meshes;
    for (var meshId in meshes) {
        this.scene.remove(meshes[meshId]);
    }
    delete this.chunks[chunkId];
};

App.Engine.Graphics.prototype.unloadChunk = function(chunkId) {

};
