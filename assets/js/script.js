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

// Add galaxy background with stars
const numStars = 5000; // Increase the number of stars for better coverage
const starsGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(numStars * 3);

// Distribute stars across a wider area
for (let i = 0; i < numStars; i++) {
  const x = (Math.random() - 0.5) * 400; // Spread across x: -200 to 200
  const y = (Math.random() - 0.5) * 400; // Spread across y: -200 to 200
  const z = -Math.random() * 200 - 20; // Position behind the scene: z from -220 to -20
  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
}

starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

// Define the material for the stars
const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff, // White stars
  size: 0.5, // Larger size for better visibility
  transparent: true,
  opacity: 1, // Full opacity to ensure they stand out
});

const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Circuit board parameters
const boardWidth = 30;
const boardDepth = 30;
const gridSize = 40;
const cellSize = boardWidth / gridSize;

// Mouse interaction
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let mouseInfluenceRadius = 5;

// Create a plane to detect mouse position
const interactionPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(boardWidth, boardDepth),
  new THREE.MeshBasicMaterial({ visible: false }),
);
interactionPlane.rotation.x = -Math.PI / 2;
scene.add(interactionPlane);

// Cellular automata grid
let grid = [];
let nextGrid = [];

// Initialize grids
for (let x = 0; x < gridSize; x++) {
  grid[x] = [];
  nextGrid[x] = [];
  for (let z = 0; z < gridSize; z++) {
    grid[x][z] = Math.random() < 0.3 ? 1 : 0;
    nextGrid[x][z] = 0;
  }
}

// Create visual representation
const cells = new THREE.Group();
const nodeGeometry = new THREE.BoxGeometry(cellSize * 0.8, 0.2, cellSize * 0.8);
const nodeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.5,
});

const cellMeshes = [];

for (let x = 0; x < gridSize; x++) {
  cellMeshes[x] = [];
  for (let z = 0; z < gridSize; z++) {
    const cell = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    cell.position.x = (x - gridSize / 2) * cellSize + cellSize / 2;
    cell.position.y = 0;
    cell.position.z = (z - gridSize / 2) * cellSize + cellSize / 2;
    cell.visible = grid[x][z] === 1;
    cell.userData = {
      pulsePhase: Math.random() * Math.PI * 2,
      gridX: x,
      gridZ: z,
    };
    cells.add(cell);
    cellMeshes[x][z] = cell;
  }
}

scene.add(cells);

// Create circuit connections
const connectionGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
connectionGeometry.rotateX(Math.PI / 2);
const connectionMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.2,
});
const connections = new THREE.Group();

function updateConnections() {
  while (connections.children.length > 0) {
    connections.remove(connections.children[0]);
  }

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      if (grid[x][z] === 1) {
        const directions = [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ];

        for (const [dx, dz] of directions) {
          const nx = x + dx;
          const nz = z + dz;

          if (
            nx >= 0 &&
            nx < gridSize &&
            nz >= 0 &&
            nz < gridSize &&
            grid[nx][nz] === 1
          ) {
            const connection = new THREE.Mesh(
              connectionGeometry,
              connectionMaterial.clone(),
            );
            connection.position.x =
              (x - gridSize / 2) * cellSize +
              cellSize / 2 +
              (dx * cellSize) / 2;
            connection.position.z =
              (z - gridSize / 2) * cellSize +
              cellSize / 2 +
              (dz * cellSize) / 2;
            connection.scale.z = cellSize * 0.8;
            if (dx !== 0) {
              connection.rotation.y = Math.PI / 2;
            }
            connections.add(connection);
          }
        }
      }
    }
  }
}

scene.add(connections);

cells.position.x = 10;
connections.position.x = 10;

// Update automata according to custom rules
function updateAutomata() {
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      let neighbors = 0;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dz === 0) continue;
          const nx = x + dx;
          const nz = z + dz;
          if (nx >= 0 && nx < gridSize && nz >= 0 && nz < gridSize) {
            neighbors += grid[nx][nz];
          }
        }
      }
      if (grid[x][z] === 1) {
        nextGrid[x][z] = neighbors === 2 || neighbors === 3 ? 1 : 0;
      } else {
        nextGrid[x][z] = neighbors === 3 ? 1 : 0;
      }
    }
  }

  if (mouse.x !== 0 || mouse.y !== 0) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(interactionPlane);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const gridX = Math.floor((point.x + boardWidth / 2) / cellSize);
      const gridZ = Math.floor((point.z + boardDepth / 2) / cellSize);
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const nx = gridX + dx;
          const nz = gridZ + dz;
          if (nx >= 0 && nx < gridSize && nz >= 0 && nz < gridSize) {
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance <= 2) {
              nextGrid[nx][nz] = 1;
            }
          }
        }
      }
    }
  }

  [grid, nextGrid] = [nextGrid, grid];
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      cellMeshes[x][z].visible = grid[x][z] === 1;
    }
  }
  updateConnections();
}

// Position camera
camera.position.set(0, 25, 25);
camera.lookAt(0, 0, 0);

// Animation timing
let lastUpdate = 0;
const updateInterval = 250;

// Animation
const animate = () => {
  requestAnimationFrame(animate);

  const time = Date.now();
  if (time - lastUpdate > updateInterval) {
    updateAutomata();
    lastUpdate = time;
  }

  const normalizedTime = time * 0.001;

  // Pulse active cells
  cells.children.forEach((cell) => {
    if (cell.visible) {
      const scale =
        0.8 + Math.sin(normalizedTime + cell.userData.pulsePhase) * 0.3;
      cell.scale.y = scale;
    }
  });

  // Rotate the circuit board
  cells.rotation.y = normalizedTime * 0.1;
  connections.rotation.y = normalizedTime * 0.1;

  // **Rotate the stars slowly for movement**
  stars.rotation.y = normalizedTime * 0.01;

  renderer.render(scene, camera);
};

animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Track mouse position
document.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});

// Glow cursor effect
const cursor = document.querySelector(".glow-cursor");

const links = document.querySelectorAll("a");
links.forEach((link) => {
  link.addEventListener("mouseenter", () => {
    cursor.style.transform = "translate(-50%, -50%) scale(2)";
  });
  link.addEventListener("mouseleave", () => {
    cursor.style.transform = "translate(-50%, -50%) scale(1)";
  });
});
