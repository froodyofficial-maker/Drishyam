// Game State Management
const STATE = {
  act: 1, // 1: Body Disposal, 2: Sensory Anchors, 3: Police Interrogation
  beliefQuotient: 0,
  inspectorSuspicion: 10,
  completedAnchors: {
    dhaba: false,
    cinema: false,
    busStop: false,
  },
  bodyBuried: false,
  activeInteractable: null,
};

// Scene, Camera, Renderer Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e17);
scene.fog = new THREE.FogExp2(0x0a0e17, 0.025);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x2d3748, 1.2);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x90cdf4, 0.8);
moonLight.position.set(40, 60, -20);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
scene.add(moonLight);

// Environment Terrain (Town Grid)
const groundGeo = new THREE.PlaneGeometry(160, 160);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Roads
const roadMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.8 });
const roadH = new THREE.Mesh(new THREE.PlaneGeometry(160, 12), roadMat);
roadH.rotation.x = -Math.PI / 2;
roadH.position.y = 0.02;
roadH.receiveShadow = true;
scene.add(roadH);

const roadV = new THREE.Mesh(new THREE.PlaneGeometry(12, 160), roadMat);
roadV.rotation.x = -Math.PI / 2;
roadV.position.y = 0.02;
roadV.receiveShadow = true;
scene.add(roadV);

// Decorative Street Lamps
function createStreetLamp(x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 6),
    new THREE.MeshStandardMaterial({ color: 0x475569 })
  );
  pole.position.set(x, 3, z);
  pole.castShadow = true;
  scene.add(pole);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.3, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
  );
  head.position.set(x, 6, z);
  scene.add(head);

  const light = new THREE.PointLight(0xfef08a, 1.5, 18);
  light.position.set(x, 5.8, z);
  scene.add(light);
}
createStreetLamp(-8, -8);
createStreetLamp(8, 8);
createStreetLamp(-8, 30);
createStreetLamp(30, -8);

// Interactive Landmark Setup
const interactables = [];

function createZoneMarker(x, z, color = 0x38bdf8) {
  const ringGeo = new THREE.RingGeometry(1.8, 2.2, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.05, z);
  scene.add(ring);
  return ring;
}

function buildBuilding(x, z, w, h, d, color, name) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  );
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.6, 1.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc })
  );
  sign.position.set(x, h - 1, z + (d / 2) + 0.15);
  scene.add(sign);
}

// 1. Police Station Construction Trench (Act 1 Disposal Site)
buildBuilding(40, 40, 20, 9, 20, 0x334155, 'Police Stn');
const trench = new THREE.Mesh(
  new THREE.BoxGeometry(6, 0.6, 6),
  new THREE.MeshStandardMaterial({ color: 0x78350f })
);
trench.position.set(25, 0.3, 25);
scene.add(trench);
const trenchRing = createZoneMarker(25, 25, 0xe11d48);

interactables.push({
  id: 'burial_site',
  name: 'Unpaved Police Station Foundation',
  x: 25,
  z: 25,
  radius: 4,
  marker: trenchRing,
  act: 1,
  action: triggerBurialSequence
});

// 2. Highway Dhaba
buildBuilding(-35, 35, 18, 6, 16, 0xb45309, 'Dhaba');
const dhabaRing = createZoneMarker(-22, 28, 0x38bdf8);
interactables.push({
  id: 'dhaba',
  name: 'Gurukrupa Dhaba Cashier',
  x: -22,
  z: 28,
  radius: 4,
  marker: dhabaRing,
  act: 2,
  action: triggerDhabaSequence
});

// 3. Regal Cinema
buildBuilding(-35, -35, 22, 11, 20, 0x4f46e5, 'Cinema');
const cinemaRing = createZoneMarker(-20, -22, 0x38bdf8);
interactables.push({
  id: 'cinema',
  name: 'Regal Cinema Ticket Counter',
  x: -20,
  z: -22,
  radius: 4,
  marker: cinemaRing,
  act: 2,
  action: triggerCinemaSequence
});

// 4. Interstate Bus Terminal
buildBuilding(35, -35, 20, 7, 18, 0x059669, 'Bus Terminus');
const busRing = createZoneMarker(22, -22, 0x38bdf8);
interactables.push({
  id: 'busStop',
  name: 'Conductor Atma Ram',
  x: 22,
  z: -22,
  radius: 4,
  marker: busRing,
  act: 2,
  action: triggerBusSequence
});

// 5. Headquarters (Act 3 Interrogation)
const stationHQRing = createZoneMarker(30, 32, 0xf43f5e);
stationHQRing.visible = false;
interactables.push({
  id: 'hq_interrogation',
  name: 'IG Geeta Rawat Interrogation Room',
  x: 30,
  z: 32,
  radius: 4,
  marker: stationHQRing,
  act: 3,
  action: triggerInterrogationSequence
});

// Player Character Setup (Dev)
const playerGroup = new THREE.Group();

const bodyMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.45, 0.45, 1.8),
  new THREE.MeshStandardMaterial({ color: 0x0284c7 })
);
bodyMesh.position.y = 0.9;
bodyMesh.castShadow = true;
playerGroup.add(bodyMesh);

const headMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xfbbf24 })
);
headMesh.position.y = 2.0;
headMesh.castShadow = true;
playerGroup.add(headMesh);

playerGroup.position.set(0, 0, 0);
scene.add(playerGroup);

// Input and Movement Control
const keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, KeyE: false };
let cameraAngleH = 0;
let isMouseDown = false;
let mouseX = 0;

window.addEventListener('keydown', (e) => {
  if (keys[e.code] !== undefined) keys[e.code] = true;
  if (e.code === 'KeyE') handleInteract();
});

window.addEventListener('keyup', (e) => {
  if (keys[e.code] !== undefined) keys[e.code] = false;
});

window.addEventListener('mousedown', (e) => {
  isMouseDown = true;
  mouseX = e.clientX;
});

window.addEventListener('mouseup', () => { isMouseDown = false; });

window.addEventListener('mousemove', (e) => {
  if (isMouseDown) {
    const delta = e.clientX - mouseX;
    cameraAngleH -= delta * 0.005;
    mouseX = e.clientX;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// UI Reference Updaters
const bqFill = document.getElementById('bq-fill');
const bqVal = document.getElementById('bq-val');
const isFill = document.getElementById('is-fill');
const isVal = document.getElementById('is-val');
const objTitle = document.getElementById('objective-title');
const objDesc = document.getElementById('objective-desc');
const promptEl = document.getElementById('interaction-prompt');
const modalOverlay = document.getElementById('modal-overlay');
const modalSpeaker = document.getElementById('modal-speaker-name');
const modalText = document.getElementById('modal-body-text');
const modalChoices = document.getElementById('modal-choices');
const toastEl = document.getElementById('notification-toast');

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.style.opacity = '1';
  setTimeout(() => { toastEl.style.opacity = '0'; }, 3500);
}

function updateHUD() {
  bqFill.style.width = `${STATE.beliefQuotient}%`;
  bqVal.textContent = `${STATE.beliefQuotient}%`;
  isFill.style.width = `${STATE.inspectorSuspicion}%`;
  isVal.textContent = `${STATE.inspectorSuspicion}%`;
}

function setObjective(title, desc) {
  objTitle.textContent = title;
  objDesc.textContent = desc;
}

function openDialogue(speaker, text, options) {
  modalSpeaker.textContent = speaker;
  modalText.textContent = text;
  modalChoices.innerHTML = '';
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'dialogue-btn';
    btn.textContent = opt.label;
    btn.onclick = () => {
      closeDialogue();
      opt.callback();
    };
    modalChoices.appendChild(btn);
  });
  modalOverlay.classList.add('active');
}

function closeDialogue() {
  modalOverlay.classList.remove('active');
}

// Act 1 Narrative Flow
function triggerBurialSequence() {
  if (STATE.bodyBuried) {
    showToast('The foundation ditch has already been leveled with sand.');
    return;
  }
  openDialogue(
    'Self-Monologue',
    'The newly dug municipal ditch sits inside the planned compound of the future police substation. Morning concrete arrives at 6:00 AM. If placed deep below the foundation stone, who would ever authorize digging up their own headquarters?',
    [
      {
        label: 'Lower the remains deep into the trench and cover with wet gravel',
        callback: () => {
          STATE.bodyBuried = true;
          STATE.act = 2;
          interactables[0].marker.visible = false;
          setObjective(
            'Act II: Chrono-Stitching',
            'Travel around town. Plant vivid sensory memories in 3 local witnesses to establish your alibi for October 2nd & 3rd.'
          );
          showToast('Body hidden beneath future police headquarters. Act II initiated.');
        },
      },
      {
        label: 'Hesitate and recheck perimeter',
        callback: () => {
          showToast('No witnesses seen. The trench remains the safest spot.');
        },
      },
    ]
  );
}

// Act 2 Sensory Anchors
function triggerDhabaSequence() {
  if (STATE.completedAnchors.dhaba) {
    showToast('The Dhaba owner already strongly links your meal to Gandhi Jayanti.');
    return;
  }
  openDialogue(
    'Dhaba Cashier (Bablu)',
    'Welcome! Table for Dev-ji! What can I get you today?',
    [
      {
        label: 'Complain loudly about the bill and point to the 2nd Oct Special Thali banner',
        callback: () => {
          STATE.completedAnchors.dhaba = true;
          STATE.beliefQuotient += 25;
          STATE.inspectorSuspicion = Math.max(0, STATE.inspectorSuspicion - 5);
          updateHUD();
          showToast('Sensory anchor set: Bablu will testify you ate here during the holiday discount.');
          checkAct2Completion();
        },
      },
      {
        label: 'Pay silently with exact change and leave',
        callback: () => {
          showToast('He received payment, but nothing distinguishes this transaction in his memory.');
        },
      },
    ]
  );
}

function triggerCinemaSequence() {
  if (STATE.completedAnchors.cinema) {
    showToast('Ticket stubs retained. The usher remembers your argument over the date.');
    return;
  }
  openDialogue(
    'Cinema Usher (Mahesh)',
    'Evening show is packed today! Tickets please, sir.',
    [
      {
        label: 'Collect 4 dropped tickets from the floor and complain: "October 2nd shows are always overcrowded!"',
        callback: () => {
          STATE.completedAnchors.cinema = true;
          STATE.beliefQuotient += 30;
          updateHUD();
          showToast('Sensory anchor set: Mahesh distinctly recalls your holiday grievance.');
          checkAct2Completion();
        },
      },
      {
        label: 'Just buy a new soda and look away',
        callback: () => {
          showToast('No emotional marker planted. Try a different approach.');
        },
      },
    ]
  );
}

function triggerBusSequence() {
  if (STATE.completedAnchors.busStop) {
    showToast('Conductor remembers the dispute over the October 3rd return change.');
    return;
  }
  openDialogue(
    'Conductor Atma Ram',
    'Panaji express! Tickets, passes, or change! Move along.',
    [
      {
        label: 'Offer an expired 500-rupee note, demanding: "You gave this change on the 3rd morning return trip!"',
        callback: () => {
          STATE.completedAnchors.busStop = true;
          STATE.beliefQuotient += 25;
          updateHUD();
          showToast('Sensory anchor set: Conductor will defend his recollection under oath.');
          checkAct2Completion();
        },
      },
      {
        label: 'Ask for timetable schedule politely',
        callback: () => {
          showToast('A routine interaction. He will forget you by tomorrow.');
        },
      },
    ]
  );
}

function checkAct2Completion() {
  const { dhaba, cinema, busStop } = STATE.completedAnchors;
  if (dhaba && cinema && busStop) {
    STATE.act = 3;
    stationHQRing.visible = true;
    setObjective(
      'Act III: The Crucible',
      'Report to the newly built Police Station. Endure IG Geeta Rawats interrogation without contradicting your anchors.'
    );
    showToast('All witnesses primed. Report to police headquarters.');
  }
}

// Act 3 The Crucible Interrogation
function triggerInterrogationSequence() {
  openDialogue(
    'IG Geeta Rawat',
    'Dev. My son went missing on October 2nd. A yellow sedan identical to his was pulled from the quarry yesterday. Where were you on the 2nd and 3rd of October?',
    [
      {
        label: '"I was home in our cable operator office working on local line repairs."',
        callback: () => {
          STATE.inspectorSuspicion += 50;
          updateHUD();
          failInterrogation('Contradiction detected: Three town citizens already swore you were out of town.');
        },
      },
      {
        label: '"We attended the Swami Chinmayananda satsang in Panaji, ate at Bablu Dhaba, and caught the evening film."',
        callback: () => interrogateStepTwo(),
      },
    ]
  );
}

function interrogateStepTwo() {
  openDialogue(
    'IG Geeta Rawat',
    'A convenient family outing on a national holiday. We summoned the Dhaba owner and cinema ticket master. Both corroborate your presence. But our forensic dogs picked up scents at this very building’s foundation. What did you bury beneath our station?',
    [
      {
        label: '"A stray dog carcass died near our yard. I buried it there before your contractor poured cement."',
        callback: () => victoryAcquittal(),
      },
      {
        label: '"I have never entered this construction site in my life."',
        callback: () => {
          STATE.inspectorSuspicion = 100;
          updateHUD();
          failInterrogation('The contractor recalled an unauthorized burial pit. The inconsistency proved fatal.');
        },
      },
    ]
  );
}

function victoryAcquittal() {
  document.getElementById('screen-tint').style.background = 'rgba(16, 185, 129, 0.4)';
  openDialogue(
    'Investigation Closed - Verdict: Acquitted',
    'Forensic excavation under the station yielded non-human canine remains. Every civilian witness testified with unwavering conviction that you were fifty miles away on October 2nd. Drishyam achieved: Truth is not what happened; truth is what people believe.',
    [
      {
        label: 'Play Again',
        callback: () => location.reload(),
      },
    ]
  );
}

function failInterrogation(reason) {
  document.getElementById('screen-tint').style.background = 'rgba(239, 68, 68, 0.5)';
  openDialogue(
    'Interrogation Rupture - Conviction',
    `Case cracked by IG Geeta Rawat. ${reason} The confession was signed before sunrise.`,
    [
      {
        label: 'Restart from Beginning',
        callback: () => location.reload(),
      },
    ]
  );
}

function handleInteract() {
  if (STATE.activeInteractable) {
    STATE.activeInteractable.action();
  }
}

// Proximity & Interaction Checks
function checkInteractables() {
  const px = playerGroup.position.x;
  const pz = playerGroup.position.z;
  let nearest = null;
  let minDist = Infinity;

  interactables.forEach((item) => {
    if (item.act !== STATE.act && !(STATE.act === 2 && item.act === 2)) return;
    const dist = Math.hypot(item.x - px, item.z - pz);
    if (dist < item.radius && dist < minDist) {
      minDist = dist;
      nearest = item;
    }
  });

  STATE.activeInteractable = nearest;
  if (nearest) {
    promptEl.style.display = 'block';
    promptEl.textContent = `[E] ${nearest.name}`;
  } else {
    promptEl.style.display = 'none';
  }
}

// Game Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Movement Physics
  let moveX = 0;
  let moveZ = 0;
  if (keys.KeyW || keys.ArrowUp) moveZ -= 1;
  if (keys.KeyS || keys.ArrowDown) moveZ += 1;
  if (keys.KeyA || keys.ArrowLeft) moveX -= 1;
  if (keys.KeyD || keys.ArrowRight) moveX += 1;

  if (moveX !== 0 || moveZ !== 0) {
    const inputAngle = Math.atan2(moveX, moveZ);
    const targetAngle = cameraAngleH + inputAngle;

    const speed = 12.0 * delta;
    playerGroup.position.x += Math.sin(targetAngle) * speed;
    playerGroup.position.z += Math.cos(targetAngle) * speed;
    playerGroup.rotation.y = targetAngle;
  }

  // 3rd Person Over-the-Shoulder Camera Tracking
  const camDistance = 8.5;
  const camHeight = 4.2;
  const targetCamX = playerGroup.position.x - Math.sin(cameraAngleH) * camDistance;
  const targetCamZ = playerGroup.position.z - Math.cos(cameraAngleH) * camDistance;
  const targetCamY = playerGroup.position.y + camHeight;

  camera.position.x += (targetCamX - camera.position.x) * 0.1;
  camera.position.y += (targetCamY - camera.position.y) * 0.1;
  camera.position.z += (targetCamZ - camera.position.z) * 0.1;
  camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.2, playerGroup.position.z);

  checkInteractables();
  renderer.render(scene, camera);
}

// Initialization
updateHUD();
animate();
