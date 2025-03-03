// 3D Circuit Board Effect with Three.js
const container = document.getElementById("canvas-container");

// Initialize scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Circuit board parameters
const boardWidth = 30;
const boardDepth = 30;
const lineCount = 200;
const nodeCount = 100;

// Create circuit lines
const lines = new THREE.Group();

for (let i = 0; i < lineCount; i++) {
  const points = [];
  let x = (Math.random() - 0.5) * boardWidth;
  let z = (Math.random() - 0.5) * boardDepth;
  const segments = Math.floor(Math.random() * 5) + 2;

  for (let j = 0; j < segments; j++) {
    points.push(new THREE.Vector3(x, 0, z));

    // Next point: 90 degree turn, maintain on grid
    if (Math.random() > 0.5) {
      x += (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 3 + 1);
    } else {
      z += (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 3 + 1);
    }
  }
  points.push(new THREE.Vector3(x, 0, z));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.3 + Math.random() * 0.3,
  });

  const line = new THREE.Line(geometry, material);
  lines.add(line);
}

scene.add(lines);

// Create circuit nodes
const nodeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const nodeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.5,
});

for (let i = 0; i < nodeCount; i++) {
  const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
  node.position.x = (Math.random() - 0.5) * boardWidth;
  node.position.y = 0;
  node.position.z = (Math.random() - 0.5) * boardDepth;
  node.userData = { pulsePhase: Math.random() * Math.PI * 2 };
  scene.add(node);
}

// Position camera
camera.position.set(0, 15, 0);
camera.lookAt(0, 0, 0);

// Animation
const animate = () => {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Rotate circuit board
  lines.rotation.y = time * 0.05;

  // Pulse nodes
  scene.children.forEach((child) => {
    if (child.isMesh) {
      const scale = 0.8 + Math.sin(time + child.userData.pulsePhase) * 0.3;
      child.scale.set(scale, scale, scale);
      child.rotation.y = time * 0.1;
    }
  });

  renderer.render(scene, camera);
};

animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Glow cursor effect
const cursor = document.querySelector(".glow-cursor");

document.addEventListener("mousemove", (e) => {
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});

// Link hover effects with cursor
const links = document.querySelectorAll("a");
links.forEach((link) => {
  link.addEventListener("mouseenter", () => {
    cursor.style.transform = "translate(-50%, -50%) scale(2)";
  });

  link.addEventListener("mouseleave", () => {
    cursor.style.transform = "translate(-50%, -50%) scale(1)";
  });
});
