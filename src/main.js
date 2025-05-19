import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { createNoise2D } from 'simplex-noise';

async function main() {
  // 1) Initialize Rapier (loads the WASM)  [oai_citation:2‡Rapier.pdf](file-service://file-SCg6aMsQydV3nGEkr1DMtT)
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  // 2) THREE.js scene, camera, renderer setup  [oai_citation:3‡Three.pdf](file-service://file-WcGAzQCzert8qgRQFRTigR)
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Basic lighting
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 10, 10);
  scene.add(dirLight, new THREE.AmbientLight(0x404040));

  // 3) Physics: ground (static) body + collider
  const groundBodyDesc = RAPIER.RigidBodyDesc.fixed();
  const groundBody = world.createRigidBody(groundBodyDesc);
  const groundColliderDesc = RAPIER.ColliderDesc.cuboid(10, 0.1, 10);
  world.createCollider(groundColliderDesc, groundBody);

  // Three.js ground mesh
  const groundGeometry = new THREE.PlaneGeometry(20, 20, 100, 100);
  const noise2D = createNoise2D();
  const position = groundGeometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    // Use simplex noise to displace the y (height) value
    const noise = noise2D(x * 0.15, y * 0.15);
    position.setZ(i, noise * 2); // scale height as needed
  }
  groundGeometry.computeVertexNormals();
  const groundMesh = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshStandardMaterial({ color: 0x777777, wireframe: false })
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // 4) Physics: cube (dynamic) body + collider
  const cubeBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0);
  const cubeBody = world.createRigidBody(cubeBodyDesc);
  const cubeColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  world.createCollider(cubeColliderDesc, cubeBody);

  // Three.js cube mesh
  const cubeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );
  cubeMesh.castShadow = true;
  scene.add(cubeMesh);

  // Handle window resizes
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // 5) Animation loop: step physics then render  [oai_citation:4‡Rapier.pdf](file-service://file-SCg6aMsQydV3nGEkr1DMtT)
  function animate() {
    world.step();

    // Sync cube mesh to physics body
    const pos = cubeBody.translation();
    cubeMesh.position.set(pos.x, pos.y, pos.z);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

main();