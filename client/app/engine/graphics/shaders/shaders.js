/**
 *
 */

'use strict';

import PortalFragment  from './portal/portal.fragment.glsl';
import PortalVertex    from './portal/portal.vertex.glsl';
import SkyFlatFragment from './sky/skyFlat.fragment.glsl';
import SkyFlatVertex   from './sky/skyFlat.vertex.glsl';
import SkyCubeFragment from './sky/skyCube.fragment.glsl';
import SkyCubeVertex   from './sky/skyCube.vertex.glsl';
import PlanetFragment  from './sky/planet.fragment.glsl';
import PlanetVertex    from './sky/planet.vertex.glsl';

let ShadersModule = {

    getPortalVertexShader() {
        return PortalVertex;
    },

    getPortalFragmentShader() {
        return PortalFragment;
    },

    getSkyCubeVertexShader() {
        return SkyCubeVertex;
    },

    getSkyCubeFragmentShader() {
        return SkyCubeFragment;
    },

    getSkyFlatVertexShader() {
        return SkyFlatVertex;
    },

    getSkyFlatFragmentShader() {
        return SkyFlatFragment;
    },

    getPlanetVertexShader() {
        return PlanetVertex;
    },

    getPlanetFragmentShader() {
        return PlanetFragment;
    }

};

export { ShadersModule };
