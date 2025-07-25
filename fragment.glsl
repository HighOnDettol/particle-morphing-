// fragment.glsl

uniform vec3 uColor; // Color of the particles

void main() {
    // gl_PointCoord gives us the (x,y) coordinate within the current point (0.0 to 1.0)
    // We can use this to make a circular point
    vec2 circleCoord = gl_PointCoord - 0.5; // Center the coordinate at 0,0
    float dist = length(circleCoord); // Distance from the center

    if (dist > 0.5) {
        discard; // Discard pixels outside the circle (makes it round)
    }

    // Basic color with a slight fade towards the edge
    gl_FragColor = vec4(uColor, 1.0 - dist * 0.5); // (R, G, B, Alpha)
}
