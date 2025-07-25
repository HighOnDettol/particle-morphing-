// vertex.glsl

// Attributes (data per particle, passed from JS)
attribute vec3 position; // The initial position (unused in this simple morph)
attribute vec3 startPosition; // Position when in the cube shape
attribute vec3 targetPosition; // Position when in the sphere shape

// Uniforms (data shared across all particles, passed from JS)
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uProgress; // 0.0 for cube, 1.0 for sphere
uniform float uParticleSize; // Size of the particle

void main() {
    // Interpolate between startPosition and targetPosition based on uProgress
    vec3 morphedPosition = mix(startPosition, targetPosition, uProgress);

    // Calculate the final position on screen
    vec4 mvPosition = viewMatrix * modelMatrix * vec4(morphedPosition, 1.0);
    gl_PointSize = uParticleSize * (1.0 / -mvPosition.z); // Adjust size based on distance
    gl_Position = projectionMatrix * mvPosition;
}
