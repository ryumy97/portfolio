#define PI (3.14159265359)

varying vec2 vUv;

uniform float u_ratio;
uniform float u_progress;
uniform vec2 u_size;

void main() {
    vUv = uv;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float y = (position.y / (u_size.y / 4.0) + 1.0) / 2.0;
    float y2 = (position.y / (u_size.y / 4.0) - 1.0) / 2.0;
    float expY1 = sin(y * PI / 2.0);
    float expY2 = sin((y2 + 1.0) * PI / 2.0);

    modelPosition.x *=
        y * clamp(u_progress, 0.0, 0.5) +
        clamp(1.0 - u_progress, 0.5, 1.0) -
        y * clamp(u_progress - 0.5, 0.0, 0.5);

    //modelPosition.x *=
    //    expY1 * clamp(u_progress, 0.0, 0.5) +
    //    clamp(1.0 - u_progress, 0.5, 1.0) +
    //    -expY2 * clamp(u_progress - 0.5, 0.0, 0.5);

    //modelPosition.x *= 1.0 / (1.0 + u_progress);

    modelPosition.y *= 1.0 / (1.0 + u_progress);

    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
