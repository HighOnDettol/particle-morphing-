// main.js

// Ensure THREE is globally available if imported via CDN in index.html
const THREE = window.THREE;

if (!THREE) {
    console.error("Three.js not found. Make sure it's loaded correctly.");
}

let scene, camera, renderer, particles, particleCount;
let cubePositions = [];
let spherePositions = [];
const PARTICLE_SIZE = 4; // Adjust particle visual size

// Load shader files
async function loadShaders() {
    const vertexShaderResponse = await fetch('vertex.glsl');
    const vertexShader = await vertexShaderResponse.text();

    const fragmentShaderResponse = await fetch('fragment.glsl');
    const fragmentShader = await fragmentShaderResponse.text();

    return { vertexShader, fragmentShader };
}

async function init() {
    // Get shaders
    const { vertexShader, fragmentShader } = await loadShaders();

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 200;

    // Renderer
    const canvas = document.getElementById('webglCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // --- Generate Target Shapes ---

    // 1. Cube Geometry (for start positions)
    const cubeGeometry = new THREE.BoxGeometry(100, 100, 100);
    cubeGeometry.computeBoundingBox(); // Needed for random point sampling

    // 2. Sphere Geometry (for target positions)
    const sphereGeometry = new THREE.SphereGeometry(70, 64, 32); // Radius, segments, rings
    sphereGeometry.computeBoundingBox(); // Needed for random point sampling

    // Determine particle count (e.g., based on the more complex shape's surface area or a fixed number)
    particleCount = 50000; // Let's try 50,000 particles

    // Store positions for cube and sphere
    const _cubePositions = [];
    const _spherePositions = [];

    // Use Three.js MeshSurfaceSampler for better distribution
    // This part requires `examples/jsm/math/MeshSurfaceSampler.js`
    // For simplicity, let's generate random points within bounding boxes for now.
    // A better approach for exact surface sampling is using MeshSurfaceSampler.
    // For this guide, we'll scatter points randomly within their bounds.

    const createRandomPoints = (geometry, count) => {
        const positions = [];
        const bbox = geometry.boundingBox;
        const width = bbox.max.x - bbox.min.x;
        const height = bbox.max.y - bbox.min.y;
        const depth = bbox.max.z - bbox.min.z;

        for (let i = 0; i < count; i++) {
            positions.push(
                Math.random() * width + bbox.min.x,
                Math.random() * height + bbox.min.y,
                Math.random() * depth + bbox.min.z
            );
        }
        return new Float32Array(positions);
    };

    // A simple (less accurate) way to get points for sphere:
    const createSpherePoints = (radius, count) => {
        const positions = [];
        for (let i = 0; i < count; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1); // For uniform distribution on a sphere
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            positions.push(x, y, z);
        }
        return new Float32Array(positions);
    };

    cubePositions = createRandomPoints(cubeGeometry, particleCount);
    spherePositions = createSpherePoints(70, particleCount); // Use the same radius as sphereGeometry

    // For better results with MeshSurfaceSampler, you'd do:
    // const sampler = new THREE.MeshSurfaceSampler(new THREE.Mesh(sphereGeometry)).build();
    // const point = new THREE.Vector3();
    // for (let i = 0; i < particleCount; i++) {
    //     sampler.sample(point);
    //     spherePositions.push(point.x, point.y, point.z);
    // }

    // --- Create Particle Geometry ---
    const particleGeometry = new THREE.BufferGeometry();

    // Add attributes
    const positions = new Float32Array(particleCount * 3); // Placeholder for initial position (not really used in shader, but required by BufferGeometry)
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('startPosition', new THREE.BufferAttribute(cubePositions, 3));
    particleGeometry.setAttribute('targetPosition', new THREE.BufferAttribute(spherePositions, 3));

    // --- Create Shader Material ---
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uProgress: { value: 0.0 }, // Initial morph progress (0.0 = cube)
            uParticleSize: { value: PARTICLE_SIZE },
            uColor: { value: new THREE.Color(0x00aaff) } // Blue color for particles
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true, // Allow transparency from fragment shader
        blending: THREE.AdditiveBlending, // Makes particles glow when overlapping
        depthWrite: false // Improves blending by not writing to depth buffer
    });

    // Create the Points object
    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Add event listener for the slider
    const morphProgressSlider = document.getElementById('morphProgress');
    morphProgressSlider.addEventListener('input', (event) => {
        // Map slider value (0-100) to shader uniform (0.0-1.0)
        particleMaterial.uniforms.uProgress.value = parseFloat(event.target.value) / 100;
    });

    // Handle window resizing
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate particles slowly
    particles.rotation.x += 0.0005;
    particles.rotation.y += 0.0007;

    renderer.render(scene, camera);
}

// Initialize the scene
init();
