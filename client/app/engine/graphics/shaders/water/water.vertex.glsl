
uniform mat4 textureMatrix;
uniform float time;

varying vec3 vNormal;
varying float trueZ;

varying vec4 mirrorCoord;
varying vec4 worldPosition;

//#include <common>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>

void main()
{
    trueZ = position.z;
	mirrorCoord = modelMatrix * vec4( position, 1.0 );
	worldPosition = mirrorCoord.xyzw;
	mirrorCoord = textureMatrix * mirrorCoord;
	vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );

    vNormal = normal;
    gl_Position = projectionMatrix * mvPosition;

    #include <logdepthbuf_vertex>
    #include <fog_vertex>
    #include <shadowmap_vertex>
}
