/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.loadTexture = function(whatTexture) {
    var loader = new THREE.TextureLoader();
    var texture = loader.load("app/assets/textures/"+whatTexture);

    // Mipmapping...
    // var p = 512;
    // for (var i = 0; i<10; ++i) {
    //     console.log(p + " " + i);
    //     var current = 'atlas_' + p + '.png';
    //     const j = i;
    //     loader.load("app/assets/textures/" + current, function(tex) {texture.mipmaps[j] = tex.image;} );
    //     p/=2;
    // }

    // Somehow anisotropy enforces linear mipmap interpolation...
    // texture.anisotropy = this.renderer.getMaxAnisotropy();
    texture.generateMipmaps = false;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    // TODO fix those ugly anisotropic white lines
    // Idea #1: use THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
    // then, var mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
    // Where materials is an [] of materials and the faces use a materialIndex paramater to get appointed the right mat.
    // Idea #2: shader

    return texture;
};

/**
 * Gives
 * i+, j+, k+, i-, j-, k-
 */
App.Engine.Graphics.prototype.getTextureCoordinates = function() {
    return {
        '1': [[0, 1], [0, 1], [0, 2], [0, 1], [0, 1], [0, 0]], // Grass
        '2': [[5, 0], [5, 0], [5, 0], [5, 0], [5, 0], [5, 0]], // Stone
        '3': [[6, 0], [6, 0], [6, 0], [6, 0], [6, 0], [6, 0]], // Dirt
        '4': [[4, 1], [4, 1], [4, 2], [4, 1], [4, 1], [4, 0]], // Wood
        '5': [[7, 0], [7, 0], [7, 0], [7, 0], [7, 0], [7, 0]], // Planks
        '6': [[10, 0], [10, 0], [10, 0], [10, 0], [10, 0], [10, 0]], // Stone bricks
        '7': [[3, 0], [3, 0], [3, 0], [3, 0], [3, 0], [3, 0]], // Bricks
        '8': [[14, 0], [14, 0], [14, 0], [14, 0], [14, 0], [14, 0]],  // Leaves (special)
        '17': [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0]],  // Sand
        '18': [[1, 10], [1, 10], [1, 10], [1, 10], [1, 10], [1, 10]] // Iron
    };
};
