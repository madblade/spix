/* To use with RingBufferGeometry */

uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
void main()
{
    vPosition = position;
    vUv = uv;

    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
}
