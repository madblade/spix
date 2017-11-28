varying vec4 pos_frag;

void main() {

   pos_frag = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

   gl_Position = pos_frag;
}
