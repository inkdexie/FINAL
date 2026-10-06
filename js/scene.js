let scene, camera, renderer, controls;
const container = document.getElementById('scene-container');
const statusEl = document.getElementById('scene-status');

const setStatus = (text, type) => {
  statusEl.textContent = text;
  statusEl.className = 'alert alert-' + type;
};

const makeBuilding = (x, z, w, h, d, color, name) => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: color })
  );
  body.position.y = h / 2;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w * 1.08, 0.3, d * 1.08),
    new THREE.MeshStandardMaterial({ color: 0x5d4037 })
  );
  roof.position.y = h + 0.15;
  group.add(roof);

  group.position.set(x, 0, z);
  group.userData.name = name;
  return group;
};

const makeTree = (x, z) => {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.18, 1, 8),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41 })
  );
  trunk.position.y = 0.5;
  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x43a047 })
  );
  leaves.position.y = 1.6;
  group.add(trunk, leaves);
  group.position.set(x, 0, z);
  return group;
};

const init = () => {
  if (typeof THREE === 'undefined') {
    setStatus('加载失败：Three.js 未加载，请检查网络', 'danger');
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaee3f7);
  scene.fog = new THREE.Fog(0xaee3f7, 25, 60);

  camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(16, 14, 18);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  controls.minDistance = 5;
  controls.maxDistance = 50;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(12, 20, 8);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  scene.add(dir);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x8bc34a })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 40),
    new THREE.MeshStandardMaterial({ color: 0xbdbdbd })
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, 0);
  scene.add(path);

  const path2 = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 3),
    new THREE.MeshStandardMaterial({ color: 0xbdbdbd })
  );
  path2.rotation.x = -Math.PI / 2;
  path2.position.set(0, 0.01, 0);
  scene.add(path2);

  const buildings = [
    { x: -8, z: -8, w: 4, h: 5, d: 3, color: 0xe3f2fd, name: '图书馆' },
    { x: 8, z: -8, w: 5, h: 7, d: 4, color: 0xfff3e0, name: '教学楼' },
    { x: -10, z: 6, w: 4, h: 4, d: 4, color: 0xfce4ec, name: '食堂' },
    { x: 10, z: 6, w: 4, h: 6, d: 3, color: 0xe8f5e9, name: '宿舍楼' },
    { x: 0, z: -12, w: 6, h: 4, d: 3, color: 0xf3e5f5, name: '体育馆' }
  ];
  buildings.forEach(b => {
    const building = makeBuilding(b.x, b.z, b.w, b.h, b.d, b.color, b.name);
    scene.add(building);
  });

  for (let i = 0; i < 12; i++) {
    const x = (Math.random() - 0.5) * 36;
    const z = (Math.random() - 0.5) * 36;
    if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
    scene.add(makeTree(x, z));
  }

  setStatus('', 'success');
  statusEl.style.display = 'none';

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();
};

window.addEventListener('load', () => {
  try {
    init();
  } catch (error) {
    setStatus('加载失败：' + error.message, 'danger');
  }
});
