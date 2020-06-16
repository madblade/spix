/**
 *
 */

'use strict';

import {
    NearestFilter, RepeatWrapping, TextureLoader
} from 'three';

let TexturesModule = {

    loadTextures()
    {
        this._nbTexturesToLoad = 2;

        this.textureAtlas = this.loadTextureAtlas('3.jpg');
        this.textureCoordinates = this.getTextureCoordinates('minecraft>1.5');

        this.textureWaterNormals = this.loadTextureNormals('water-normals.jpg');
    },

    loadTextureNormals(whatTexture)
    {
        let loader = new TextureLoader();
        loader.load(`app/assets/textures/${whatTexture}`,
            t => {
                console.log('[Graphics/Textures] Water normals loaded.');
                t.wrapS = t.wrapT = RepeatWrapping;
                this.textureWaterNormals = t;
                this._nbTexturesLoaded++;
            },
            undefined,
            () => {
                console.error('[Graphics/Textures] Failed to load water normals.');
            });
    },

    loadTextureAtlas(whatTexture)
    {
        let loader = new TextureLoader();
        // let maxAnisotropy = this.rendererManager.renderer.capabilities.getMaxAnisotropy();
        // (this produces texture bleeding!)

        // let texture =
        loader.load(`app/assets/textures/${whatTexture}`,
            t => {
                console.log('[Graphics/Textures] Texture Atlas loaded.');

                // t.anisotropy = maxAnisotropy;
                t.magFilter = NearestFilter;
                t.minFilter = NearestFilter;
                this.textureAtlas = t;
                this._nbTexturesLoaded++;
            },
            undefined,
            () => {
                console.error('[Graphics/Textures] Failed to load texture atlas.');
            });

        // texture.anisotropy = maxAnisotropy;
        // texture.generateMipmaps = false;
        // texture.magFilter = NearestFilter;
        // texture.minFilter = NearestFilter;
        // texture.minFilter = LinearMipMapLinearFilter;

        // console.log(`Max anisotropy = ${maxAnisotropy}`);

        // Mipmapping...
        // let p = 512;
        // for (let i = 0; i<10; ++i) {
        //     console.log(p + " " + i);
        //     let current = 'atlas_' + p + '.png';
        //     const j = i;
        //     loader.load("app/assets/textures/" + current, function(tex) {texture.mipmaps[j] = tex.image;} );
        //     p/=2;
        // }

        // Idea #1: use THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
        // then, let mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
        // Where materials is an [] of materials and the faces use a materialIndex parameter to get appointed the right mat.
        // Idea #2: shader

        // return texture;
    },

    /**
     * Gives
     * i+, j+, k+, i-, j-, k-
     */
    getTextureCoordinates(modelType)
    {
        let coordinates;
        if (modelType === 'minecraft>1.5') {
            coordinates = {
                // 1. only green grass
                // 1: [[4, 15], [4, 15], [4, 15], [4, 15], [4, 15], [4, 15]], // Planks
                1: [[0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15]], // Grass
                // 1: [[3, 15], [3, 15], [0, 15], [3, 15], [3, 15], [2, 15]], // Grass
                2: [[1, 15], [1, 15], [1, 15], [1, 15], [1, 15], [1, 15]], // Stone
                3: [[2, 15], [2, 15], [2, 15], [2, 15], [2, 15], [2, 15]], // Dirt
                4: [[4, 14], [4, 14], [5, 14], [4, 14], [4, 14], [5, 14]], // Wood
                5: [[4, 15], [4, 15], [4, 15], [4, 15], [4, 15], [4, 15]], // Planks
                6: [[6, 12], [6, 12], [6, 12], [6, 12], [6, 12], [6, 12]], // Stone bricks
                7: [[7, 15], [7, 15], [7, 15], [7, 15], [7, 15], [7, 15]], // Bricks
                8: [[5, 12], [5, 12], [5, 12], [5, 12], [5, 12], [5, 12]],  // Leaves (special)
                16: [[14, 3], [14, 3], [14, 3], [14, 3], [14, 3], [14, 3]], // Water
                17: [[2, 14], [2, 14], [2, 14], [2, 14], [2, 14], [2, 14]], // Sand
                18: [[1, 13], [1, 13], [1, 13], [1, 13], [1, 13], [1, 13]], // Iron
                19: [[7, 4], [7, 4], [7, 4], [7, 4], [7, 4], [7, 4]], // Obsidian

                // Format: [x from 0 from left, y from 0 from bottom]
                20: [[0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13]], // ORE GOLD,
                21: [[2, 13], [2, 13], [2, 13], [2, 13], [2, 13], [2, 13]], // ORE COAL,
                22: [[2, 12], [2, 12], [2, 12], [2, 12], [2, 12], [2, 12]], // ORE DIAMOND,
                23: [[3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12]], // ORE REDSTONE,
                32: [[0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11]], // WOOL_WHITE,
                33: [[1,  1], [1,  1], [1,  1], [1,  1], [1,  1], [1,  1]], // WOOL_GREY,
                34: [[1,  2], [1,  2], [1,  2], [1,  2], [1,  2], [1,  2]], // WOOL_CYAN,
                35: [[2,  2], [2,  2], [2,  2], [2,  2], [2,  2], [2,  2]], // WOOL_ORANGE,
                36: [[1,  3], [1,  3], [1,  3], [1,  3], [1,  3], [1,  3]], // WOOL_DARK_PURPLE,
                37: [[2,  3], [2,  3], [2,  3], [2,  3], [2,  3], [2,  3]], // WOOL_LIGHT_PURPLE,
                38: [[1,  4], [1,  4], [1,  4], [1,  4], [1,  4], [1,  4]], // WOOL_DARK_BLUE,
                39: [[2,  4], [2,  4], [2,  4], [2,  4], [2,  4], [2,  4]], // WOOL_LIGHT_BLUE,
                40: [[1,  5], [1,  5], [1,  5], [1,  5], [1,  5], [1,  5]], // WOOL_BROWN,
                41: [[2,  5], [2,  5], [2,  5], [2,  5], [2,  5], [2,  5]], // WOOL_YELLOW,
                42: [[1,  6], [1,  6], [1,  6], [1,  6], [1,  6], [1,  6]], // WOOL_DARK_GREEN,
                43: [[2,  6], [2,  6], [2,  6], [2,  6], [2,  6], [2,  6]], // WOOL_LIGHT_GREEN,
                44: [[1,  7], [1,  7], [1,  7], [1,  7], [1,  7], [1,  7]], // WOOL_RED,
                45: [[2,  7], [2,  7], [2,  7], [2,  7], [2,  7], [2,  7]], // WOOL_ROSE,
                46: [[1,  8], [1,  8], [1,  8], [1,  8], [1,  8], [1,  8]], // WOOL_BLACK,
                47: [[2,  8], [2,  8], [2,  8], [2,  8], [2,  8], [2,  8]], // WOOL_DARK_GREY,
                48: [[0,  6], [0,  6], [0,  6], [0,  6], [0,  6], [0,  6]], // LAPIS,
                49: [[0, 12], [0, 12], [0, 12], [0, 12], [0, 12], [0, 12]], // SPONGE,
                50: [[1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14]], // BEDROCK,
                51: [[4, 13], [4, 13], [4, 13], [4, 13], [4, 13], [4, 13]], // MOSSY_STONE,
                52: [[5,  9], [5,  9], [5,  9], [5,  9], [5,  9], [5,  9]], // CRACKED_STONE,
                53: [[15, 5], [15, 5], [15, 5], [15, 5], [15, 5], [15, 5]], // ENDER,
                54: [[7,  9], [7,  9], [7,  9], [7,  9], [7,  9], [7,  9]], // NETHER,
                55: [[8, 14], [8, 14], [8, 14], [8, 14], [8, 14], [8, 14]], // DIAMOND,
                56: [[7, 14], [7, 14], [7, 14], [7, 14], [7, 14], [7, 14]], // GOLD,
            };
        } else {
            console.warn('[Textures] Unsupported MC texture version.');
            coordinates = {
                1: [[0, 1], [0, 1], [0, 2], [0, 1], [0, 1], [0, 0]], // Grass
                2: [[5, 0], [5, 0], [5, 0], [5, 0], [5, 0], [5, 0]], // Stone
                3: [[6, 0], [6, 0], [6, 0], [6, 0], [6, 0], [6, 0]], // Dirt
                4: [[4, 1], [4, 1], [4, 2], [4, 1], [4, 1], [4, 0]], // Wood
                5: [[7, 0], [7, 0], [7, 0], [7, 0], [7, 0], [7, 0]], // Planks
                6: [[10, 0], [10, 0], [10, 0], [10, 0], [10, 0], [10, 0]], // Stone bricks
                7: [[3, 0], [3, 0], [3, 0], [3, 0], [3, 0], [3, 0]], // Bricks
                8: [[14, 0], [14, 0], [14, 0], [14, 0], [14, 0], [14, 0]],  // Leaves (special)
                17: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0]],  // Sand
                18: [[1, 10], [1, 10], [1, 10], [1, 10], [1, 10], [1, 10]] // Iron
            };
        }
        return coordinates;
    }

};

export { TexturesModule };
