import { BufferAttribute, BufferGeometry, Color, Vector3 } from 'three';

/**
 * Bundle for chunks.
 * Intended to reduce draw calls,
 * but finally should be used for volume shadows...
 */

let Chundle = {

    addEmptyChundle(worldId)
    {
        let c = {
            geometries:         [],
            meshes:             [],
            water:              [], // isWater

            capacities:         [], // 2 triangles per face
            sizes:              [],

            whereToFindFace:    new Map(), // chunk id -> face id -> [meshId, position in mesh] // TODO upper level
            whichFaceIs:        new Map(), // meshId -> position in mesh -> [face id, chunk id] // TODO lower level
        };

        this.chundle.set(worldId, c);
    },

    pushChunk(
        worldId,
        chunkId, all,
        chunkSizeX, chunkSizeY, chunkSizeZ,
        isWorldFlat
    )
    {
        let components = all[0];
        let natures = all[1];

        let c = this.chundle.get(worldId);
        if (!c)
        {
            console.error('[Chundle] Could not find world.');
            return;
        }

        // console.log(components);
        // console.log(natures);

        let currentComponent;
        let currentNatures;

        if (!components.hasOwnProperty('1') && !components.hasOwnProperty('2'))
        {
            // if (debugChunks) console.log(`[Terrain/Chunks] Empty chunk "${chunkId}".`);
            this.pushEmptyChunkComponent(worldId, chunkId, chunkSizeX, chunkSizeY, chunkSizeZ);
            return;
        }

        let hasTerrain = components.hasOwnProperty('1') && natures.hasOwnProperty('1');
        let hasWater = components.hasOwnProperty('2') && natures.hasOwnProperty('2');

        // if (debugChunks)
        // {
        //     if (!hasTerrain) console.log('New chunk with empty terrain.');
        //     if (!hasWater) console.log('New chunk with empty water.');
        // }

        if (hasTerrain && hasWater)
        {
            currentComponent = components['1'];
            currentNatures = natures['1'];
            this.pushChunkComponent(
                worldId,
                chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
                currentComponent, currentNatures, false,
                isWorldFlat
            );

            currentComponent = components['2'];
            currentNatures = natures['2'];
            this.pushChunkComponent(
                worldId,
                chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
                currentComponent, currentNatures, true,
                isWorldFlat
            );
        }
        else if (hasTerrain)
        {
            currentComponent = components['1'];
            currentNatures = natures['1'];
            this.pushChunkComponent(
                worldId,
                chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
                currentComponent, currentNatures, false,
                isWorldFlat // although not water so no care
            );
        }
        else if (hasWater)
        {
            currentComponent = components['2'];
            currentNatures = natures['2'];
            this.pushChunkComponent(
                worldId,
                chunkId, chunkSizeX, chunkSizeY, chunkSizeZ,
                currentComponent, currentNatures, true,
                isWorldFlat
            );
        }
    },

    pushEmptyChunkComponent(
        worldId,
        chunkId,
    )
    {
        let c = this.chundle.get(worldId);
        let whereToFindFace = c.whereToFindFace;
        // let whichFaceIs = c.whichFaceIs;
        if (!whereToFindFace.has(chunkId)) whereToFindFace.set(chunkId, new Map());
    },

    pushChunkComponent(
        worldId,
        chunkId,
        chunkSizeX, chunkSizeY, chunkSizeZ,
        currentComponent, currentNatures,
        isWater, isWorldFlat
    )
    {
        let c = this.chundle.get(worldId);
        let geometries = c.geometries;
        let meshes = c.meshes;
        let sizes = c.sizes;
        let capacities = c.capacities;
        let waters = c.water;

        let whereToFindFace = c.whereToFindFace;
        let whichFaceIs = c.whichFaceIs;
        if (!whereToFindFace.has(chunkId)) whereToFindFace.set(chunkId, new Map());
        let whereToFindFaceInCurrentChunk = whereToFindFace.get(chunkId);

        let chunkIndices = chunkId.split(',');
        let iChunkOffset = parseInt(chunkIndices[0], 10) * chunkSizeX;
        let jChunkOffset = parseInt(chunkIndices[1], 10) * chunkSizeY;
        let kChunkOffset = parseInt(chunkIndices[2], 10) * chunkSizeZ;

        let iS = chunkSizeX;
        let ijS = chunkSizeX * chunkSizeY;
        let ijkS = ijS * chunkSizeZ;

        let pA = new Vector3(); let pB = new Vector3();
        let pC = new Vector3(); let cb = new Vector3();
        let ab = new Vector3(); let color = new Color();

        for (let f = 0; f < currentComponent.length; ++f)
        {
            let geometry;
            let cap;
            let size;
            let componentIndex;
            for (let g = 0; g < geometries.length; ++g) // get last geometry
            {
                if (waters[g] !== isWater) continue;
                if (sizes[g] >= capacities[g]) continue;
                cap = capacities[g];
                size = sizes[g];
                componentIndex = g;
            }
            let positions; let normals; let colors; let uvs;
            if (!cap || size >= cap)
            {
                componentIndex = geometries.length;
                let triangles = 2 * this.shadowGeometrySize;
                let sunCapacity = triangles; // Math.floor(3 / 2 * triangles);
                sunCapacity += sunCapacity % 2; // Make it pair
                if (this.debug)
                    console.log(`On chunk ${chunkId}, init geometry will be ${sunCapacity * 3 * 3}-capable.`);
                positions = new Float32Array(sunCapacity * 3 * 3);
                normals = new Float32Array(sunCapacity * 3 * 3);
                colors = new Float32Array(sunCapacity * 3 * 3);
                uvs = new Float32Array(sunCapacity * 3 * 2);
                geometry = new BufferGeometry();
                geometry.setAttribute('position', new BufferAttribute(positions, 3));
                geometry.setAttribute('normal', new BufferAttribute(normals, 3));
                whichFaceIs.set(componentIndex, new Map());
                let newMesh = this.createChunkMesh(geometry, isWater, isWorldFlat);
                this.addToScene(newMesh, worldId);

                meshes.push(newMesh);
                geometries.push(geometry);
                capacities.push(sunCapacity / 2);
                size = 0;
                sizes.push(1);
                waters.push(isWater);

                // let material = newMesh.material;
                // let newMesh = new Mesh(geometry, material);
                // newMesh.castShadow = true;
                // newMesh.receiveShadow = true;
                // if (Math.random() < 0.5) newMesh.userData.bloom = true;
            }
            else
            {
                geometry = geometries[componentIndex];
                size = sizes[componentIndex];
                ++sizes[componentIndex];
                cap = capacities[componentIndex];
                positions = geometry.attributes.position.array;
                normals =   geometry.attributes.color.array;
            }

            let faceId = Math.abs(currentComponent[f]);

            let newGeometryId = componentIndex;
            whereToFindFaceInCurrentChunk.set(faceId, [newGeometryId, f]);
            // [In which geometry a given face is, at which position]
            let wf0 = whichFaceIs.get(newGeometryId);
            if (wf0 === undefined) {
                wf0 = new Map();
                whichFaceIs.set(newGeometryId, wf0);
            }
            wf0.set(size, [faceId, chunkId]);

            let normal = currentNatures[f] > 0;

            this.addFace(
                faceId,
                size * 18, iS, ijS, ijkS,
                positions, normals, colors, uvs,
                Math.abs(currentNatures[f]),
                iChunkOffset,
                jChunkOffset,
                kChunkOffset,
                pA, pB, pC, cb, ab,
                normal, color
            );

            // Bump geometries
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.normal.needsUpdate = true;
            if (size >= cap || f === currentComponent.length - 1)
            {
                // console.log('bounding');
                // geometry.computeBoundingSphere();
            }
            else if (size === 1)
            {
                // console.log('bounding');
                // geometry.computeBoundingSphere();
                // console.log(geometry.boundingSphere);
            }
        }
    },

    updateChundleChunk(
        worldId, chunkId, components,
        chunkSizeX, chunkSizeY, chunkSizeZ,
        isWorldFlat
    )
    {
        let chunk = this.chundle.get(worldId);

        let geometries =        chunk.geometries;
        let meshes =            chunk.meshes;
        let capacities =        chunk.capacities;
        let sizes =             chunk.sizes;
        let water =             chunk.water;
        let whereToFindFace =   chunk.whereToFindFace;
        let whichFaceIs =       chunk.whichFaceIs;

        if (!whereToFindFace || !whichFaceIs || !whereToFindFace.has(chunkId))
        {
            console.error('[Chundle] Faulty model lookup.');
            return;
        }

        // let whereToFindFaceInCurrentChunk = whereToFindFace.get(chunkId);

        let removed =   components[0];
        let added =     components[1];
        let updated =   components[2];

        // Bundle updated faces.
        for (let uid in updated)
        {
            if (!updated.hasOwnProperty(uid)) continue;
            let update = updated[uid];
            removed[uid] = null;
            added[uid] = update;
        }

        this.removeChunkFaces(
            chunkId,
            worldId,
            removed,
            geometries, meshes,
            capacities, sizes,
            whereToFindFace,
            whichFaceIs
        );

        this.addChunkFaces(
            chunkId,
            worldId,
            added, geometries, meshes, capacities, sizes,
            water,
            whereToFindFace,
            whichFaceIs,
            chunkSizeX, chunkSizeY, chunkSizeZ,
            isWorldFlat);
    },

    unloadChundleChunk(worldId, chunkId)
    {
        let c = this.chundle.get(worldId);
        if (!c)
        {
            console.error('[Chundle] World not found.');
            return;
        }

        let chunksToFaces = c.whereToFindFace;
        if (!chunksToFaces || !chunksToFaces.has(chunkId))
        {
            console.log(chunkId);
            console.log(chunksToFaces);
            console.error('[Chundle] Could not remove a chunk that is not present.');
            return;
        }

        let geometries = c.geometries;
        let meshes = c.meshes;
        let capacities = c.capacities;
        let sizes = c.sizes;
        let whereToFindFaceInCurrentChunk = chunksToFaces.get(chunkId);
        let whichFaceIs = c.whichFaceIs;
        let allFaces = chunksToFaces.get(chunkId);

        if (!allFaces)
        {
            console.error('[Chundle] Could not retrieve chunk faces.');
            return;
        }
        if (!allFaces.reduce) return; // empty map

        // find all faces from chunk
        let removed = allFaces.reduce((acc, curr) =>
        {
            acc[curr] = '';
            return acc;
        }, {});

        this.removeChunkFaces(
            chunkId,
            worldId,
            removed,
            geometries, meshes,
            capacities, sizes,
            whereToFindFaceInCurrentChunk,
            whichFaceIs
        );
    },
};

export { Chundle };
