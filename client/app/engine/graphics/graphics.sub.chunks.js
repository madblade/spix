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
    var components = all[0];
    var natures = all[1];

    var currentComponent;
    for (var cid in components) {
        // TODO use face ids
        if (!components.hasOwnProperty(cid)) continue;
        currentComponent = components[cid];
        break;
    }

    var chunkIndices = chunkId.split(',');
    var chunkI = parseInt(chunkIndices[0]);
    var chunkJ = parseInt(chunkIndices[1]);
    var iChunkOffset = chunkI * this.chunkSizeX;
    var jChunkOffset = chunkJ * this.chunkSizeY;

    var ijkS = this.chunkCapacity;
    var ijS = this.chunkSizeX * this.chunkSizeY;
    var iS = this.chunkSizeX;
    var triangles = 2 * currentComponent.length;
    var sunCapacity = Math.floor(3/2 * triangles);
    c.capacities = [sunCapacity];
    c.sizes = [triangles];

    var positions = new Float32Array(sunCapacity * 3 * 3);
    var normals = new Float32Array(sunCapacity * 3 * 3);
    var colors = new Float32Array(sunCapacity * 3 * 3);

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
        c.whichFaceIs[f] = faceId;
        var normal = faceId > 0;

        this.addFace(faceId, i, iS, ijS, ijkS,
            positions, normals, colors, natures,
            iChunkOffset, jChunkOffset,
            pA, pB, pC, cb, ab,
            normal, color, n);

        i += 18;
    }

    c.geometries[0].addAttribute('position', new THREE.BufferAttribute(positions, 3));
    c.geometries[0].addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    c.geometries[0].addAttribute('color', new THREE.BufferAttribute(colors, 3));
    c.geometries[0].computeBoundingSphere();

    // Make material and mesh.
    c.materials = [new THREE.MeshPhongMaterial({
        color: 0xaaaaaa, specular: 0xffffff, shininess: 250,
        side: THREE.BackSide, vertexColors: THREE.VertexColors
    })];
    c.meshes = [new THREE.Mesh(c.geometries[0], c.materials[0])];

    // Add to scene.
    this.scene.add(c.meshes[0]);
};

App.Engine.Graphics.prototype.updateChunk = function(chunkId, components) {
    console.log('updating chunk...');

    var c = this.chunks[chunkId];

    var geometries = c.geometries;
    var whereToFindFace = c.whereToFindFace;
    var whichFaceIs = c.whichFaceIs;
    var meshes = c.meshes;
    var materials = c.materials;
    var capacities = c.capacities;
    var sizes = c.sizes;

    var meshId = 0;
    var removed = components[0];
    for (var rid in removed) {
        // Get graphic data
        if (!removed.hasOwnProperty(rid)) continue;
        if (!whereToFindFace.hasOwnProperty(rid)) {
            console.log("Trying to remove a face that is not present in chunk.");
            continue;
        }

        meshId = whereToFindFace[rid][0];
        var position = whereToFindFace[rid][1];

        var vertices = geometries[meshId].attributes.position.array;
        var colors = geometries[meshId].attributes.color.array;
        var normals = geometries[meshId].attributes.normal.array;
        var lastPosition = sizes[meshId] - 1;
        var isLast = lastPosition === position;

        // Update
        for (var i = 0; i<18; ++i) {
            var p = 18 * position + i;
            if (isLast) {
                // Delete current
                vertices[p] = normals[p] = colors[p] = 0;
            } else {
                // Swap current with last
                var lp = 18 * lastPosition + i;
                vertices[p] = vertices[lp];
                normals[p] = normals[lp];
                colors[p] = colors[lp];
                // Delete last
                vertices[lp] = normals[lp] = colors[lp] = 0;
            }
        }

        // Update helpers (swap last if applicable).
        if (!isLast) {
            whereToFindFace[whichFaceIs[lastPosition]] = [meshId, position];
            whichFaceIs[position] = whichFaceIs[lastPosition];
        }
        delete whichFaceIs[lastPosition];
        delete whereToFindFace[rid];

        // Notify object
        geometries[meshId].attributes.position.needsUpdate = true;
        geometries[meshId].attributes.color.needsUpdate = true;
        geometries[meshId].attributes.normal.needsUpdate = true;
    }

    var added = components[1];
    for (var aid in added) {
        // Get graphic data
        if (!removed.hasOwnProperty(rid)) continue;
        if (whereToFindFace.hasOwnProperty(rid)) {
            console.log("Trying to add a face that is already present in chunk.");
            continue;
        }

        // Compute mesh id
        meshId = 0;
        var meshHasToBeAdded = false;
        while (sizes[meshId] !== undefined && sizes[meshId] === capacities[meshId]) ++meshId;
        if (sizes[meshId] === undefined) {
            // Create geometry
            geometries[meshId] = new THREE.BufferGeometry();
            materials[meshId] = new THREE.MeshPhongMaterial({
                color: 0xaaaaaa, specular: 0xffffff, shininess: 250,
                side: THREE.BackSide, vertexColors: THREE.VertexColors
            });
            sizes[meshId] = 1;
            capacities[meshId] = 10;
            meshHasToBeAdded = true;
        }

        // TODO add other faces...

        if (meshHasToBeAdded) {
            meshes[meshId] = new THREE.Mesh(geometries[meshId], materials[meshId]);
            this.scene.add(meshes[meshId]);
        }
    }

    var updated = components[2];
    for (var uid in updated) {
        // change
    }
};

// TODO dynamically remove chunks with GreyZone
App.Engine.Graphics.prototype.removeChunk = function(chunkId) {
    var meshes = this.chunks[chunkId].meshes;
    for (var meshId in meshes) {
        if (!meshes.hasOwnProperty(meshId)) continue;
        this.scene.remove(meshes[meshId]);
    }
    delete this.chunks[chunkId];
};
