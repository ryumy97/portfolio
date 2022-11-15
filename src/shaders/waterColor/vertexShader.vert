#define PI (3.14159265359)

varying vec2 vUv;

void main() {
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
}
