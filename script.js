
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const defaults = {
    money: 500, subs: 0, level: 1, videos: 0, team: 0,
    energy: 100, studio: 1, drafts: 0, fame: 0,
    events: 0, views: 0, name: "Rookie Creator"
  };

  let game = {...defaults};
  try {
    const saved = JSON.parse(localStorage.getItem("creatorEmpire3D"));
    if (saved && typeof saved === "object") game = {...defaults, ...saved};
  } catch (_) {}

  let toastTimer;
  function notify(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
    $("status").textContent = message;
  }

  function save(silent = false) {
    try {
      localStorage.setItem("creatorEmpire3D", JSON.stringify(game));
      if (!silent) notify("Game saved on this device!");
    } catch (_) {
      notify("Could not save. Check browser storage settings.");
    }
  }

  function render() {
    $("money").textContent = "₹" + Math.floor(game.money).toLocaleString("en-IN");
    $("subs").textContent = game.subs.toLocaleString("en-IN");
    $("level").textContent = game.level;
    $("videos").textContent = game.videos;
    $("team").textContent = game.team;
    $("energy").textContent = game.energy;
    $("creatorName").textContent = game.name;
    $("rank").textContent = rankName() + " · Level " + game.level;
    $("hireCost").textContent = "Cost: ₹" + hireCost().toLocaleString("en-IN");
    $("upgradeCost").textContent = "Cost: ₹" + upgradeCost().toLocaleString("en-IN");

    const target = game.level * 100;
    const current = game.subs % target;
    $("progressLabel").textContent = game.subs.toLocaleString("en-IN") + " subscribers";
    $("progressBar").style.width = Math.min(100, current / target * 100) + "%";
    $("analytics").textContent = game.views.toLocaleString("en-IN") +
      " total views · " + game.events + " events attended";
    $("sceneText").textContent = game.studio === 1
      ? "Your creator journey starts here."
      : "Studio level " + game.studio + " · Your production setup is improving.";
  }

  function rankName() {
    if (game.subs >= 1000000) return "Mega Creator";
    if (game.subs >= 100000) return "Superstar";
    if (game.subs >= 10000) return "Famous Creator";
    if (game.subs >= 1000) return "Rising Creator";
    return "Beginner";
  }

  function hireCost() { return 300 + game.team * 450; }
  function upgradeCost() { return 700 * game.studio; }

  function act(cost, fn) {
    if (game.money < cost) {
      notify("Not enough money! Upload videos to earn more.");
      return false;
    }
    game.money -= cost;
    fn();
    render();
    save(true);
    return true;
  }

  $("record").addEventListener("click", () => {
    if (game.energy < 15) {
      notify("You're exhausted! Take a break before recording.");
      return;
    }
    game.energy -= 15;
    game.drafts++;
    const quality = Math.min(100, 25 + game.studio * 8 + game.team * 5);
    notify("Video recorded! Production quality: " + quality + "/100. Upload it next.");
    render();
    save(true);
  });

  $("upload").addEventListener("click", () => {
    if (!game.drafts) {
      notify("Record a video before uploading!");
      return;
    }
    game.drafts--;
    game.videos++;
    const quality = 1 + game.studio * 0.25 + game.team * 0.15;
    const views = Math.floor((40 + Math.random() * 180) * quality *
      (1 + Math.log10(game.subs + 1) * 0.15));
    const gained = Math.max(1, Math.floor(views * (0.12 + Math.random() * 0.12)));
    const income = Math.floor(views * 0.8);
    game.views += views;
    game.subs += gained;
    game.money += income;
    game.fame += gained;
    game.level = Math.floor(game.subs / 1000) + 1;
    render();
    save(true);
    notify("Video published! +" + views + " views, +" + gained +
      " subscribers, +₹" + income + ".");
  });

  $("hire").addEventListener("click", () => {
    const cost = hireCost();
    act(cost, () => {
      game.team++;
      notify("You hired an editor! Video quality has improved.");
    });
  });

  $("upgrade").addEventListener("click", () => {
    const cost = upgradeCost();
    act(cost, () => {
      game.studio++;
      notify("Studio upgraded to level " + game.studio + "!");
      update3D();
    });
  });

  $("event").addEventListener("click", () => {
    const cost = 150 + game.events * 100;
    act(cost, () => {
      game.events++;
      const gained = 20 + Math.floor(Math.random() * 81);
      game.subs += gained;
      game.fame += gained;
      game.level = Math.floor(game.subs / 1000) + 1;
      notify("Creator event complete! You met new creators and gained " + gained + " subscribers.");
    });
  });

  $("sponsor").addEventListener("click", () => {
    if (game.subs < 100) {
      notify("Brands usually want an audience. Reach 100 subscribers first!");
      return;
    }
    const reward = Math.floor(200 + game.subs * 0.3 + game.studio * 100);
    game.money += reward;
    game.fame += 5;
    notify("Brand deal completed! You earned ₹" + reward + ".");
    render();
    save(true);
  });

  $("save").addEventListener("click", () => save());

  // Three.js 3D studio
  let scene, camera, renderer, avatar, studioObjects = [];
  const sceneEl = $("scene");

  function mat(color, roughness = 0.8, metalness = 0) {
    return new THREE.MeshStandardMaterial({color, roughness, metalness});
  }

  function addBox(w, h, d, color, x, y, z, material = null) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material || mat(color)
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    studioObjects.push(mesh);
    return mesh;
  }

  function addCylinder(rt, rb, h, color, x, y, z, segments = 24) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, segments),
      mat(color, 0.55)
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    scene.add(mesh);
    studioObjects.push(mesh);
    return mesh;
  }

  function init3D() {
    if (!window.THREE) {
      notify("3D engine could not load. Check your internet connection.");
      return;
    }

    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color("#101a2a");
      scene.fog = new THREE.Fog("#101a2a", 12, 35);

      camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
      camera.position.set(8, 6.2, 10);
      camera.lookAt(0, 1.2, 0);

      renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      sceneEl.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xbcdcff, 0x252033, 2.0));
      const light = new THREE.DirectionalLight(0xffffff, 2.5);
      light.position.set(4, 9, 5);
      light.castShadow = true;
      scene.add(light);

      // Room
      addBox(14, 0.3, 12, "#303b4e", 0, -0.15, 0);
      addBox(14, 7, 0.25, "#202c42", 0, 3.35, -5.8);
      addBox(0.25, 7, 12, "#172338", -7, 3.35, 0);
      addBox(0.25, 7, 12, "#172338", 7, 3.35, 0);
      addBox(14, 0.2, 12, "#101828", 0, 6.8, 0);

      // Window and city silhouettes
      addBox(3.8, 2.7, 0.12, "#64b5ff", -3.9, 3.7, -5.62);
      addBox(0.1, 2.9, 0.1, "#e3efff", -3.9, 3.7, -5.5);
      addBox(3.9, 0.1, 0.1, "#e3efff", -3.9, 3.7, -5.5);

      for (let i = 0; i < 8; i++) {
        const height = 0.5 + (i % 4) * 0.38;
        addBox(0.28, height, 0.15, "#293b59",
          -5.4 + i * 0.43, 2.1 + height / 2, -5.48);
      }

      // Desk and computer
      addBox(3.7, 0.18, 1.3, "#573d30", 0.3, 1.25, -2.3);
      for (const x of [-1.2, 1.8]) {
        addBox(0.12, 1.25, 0.12, "#333c4b", x, 0.63, -2.3);
      }

      addBox(1.65, 1.05, 0.13, "#080c14", -0.15, 2.0, -2.65);
      addBox(1.47, 0.86, 0.025, "#287aaf", -0.15, 2.02, -2.56);
      addBox(0.12, 0.3, 0.12, "#626f87", -0.15, 1.48, -2.62);
      addBox(0.65, 0.08, 0.35, "#343c4d", -0.15, 1.42, -2.62);

      // Keyboard
      addBox(1.05, 0.045, 0.32, "#141a27", 0.0, 1.37, -1.95);

      // Microphone and stand
      addCylinder(0.07, 0.07, 0.08, "#9daabd", 1.0, 1.6, -1.95);
      addCylinder(0.035, 0.035, 0.45, "#404a60", 1.0, 1.42, -1.95);
      addBox(0.65, 0.035, 0.035, "#677890", 0.78, 1.81, -1.95);

      // Ring light
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.065, 12, 40),
        new THREE.MeshStandardMaterial({
          color: "#d5f7ff", emissive: "#48bfff", emissiveIntensity: 1.2
        })
      );
      ring.position.set(3.0, 3.0, -1.7);
      scene.add(ring);
      studioObjects.push(ring);
      addCylinder(0.035, 0.035, 1.7, "#7d8ba0", 3.0, 1.15, -1.7);

      // Camera on tripod
      addBox(0.65, 0.42, 0.42, "#131b29", 3.0, 2.7, -1.2);
      addCylinder(0.07, 0.07, 0.2, "#394960", 3.0, 2.38, -1.2);
      addCylinder(0.025, 0.025, 1.2, "#7d8ba0", 3.0, 1.8, -1.2);
      addBox(0.5, 0.09, 0.09, "#65748b", 3.0, 1.3, -1.2);

      // Chair
      addBox(0.9, 1.1, 0.22, "#354e81", 0.3, 1.25, 0.15);
      addBox(0.95, 0.15, 0.8, "#273d67", 0.3, 0.72, 0.45);
      addCylinder(0.06, 0.06, 0.6, "#7b8da7", 0.3, 0.38, 0.45);
      for (const dx of [-0.32, 0.32]) {
        addBox(0.55, 0.06, 0.07, "#6d7e99", 0.3 + dx, 0.12, 0.45);
      }

      // Stylized 3D creator avatar
      avatar = new THREE.Group();
      const shirt = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.38, 0.65, 5, 12), mat("#586cbb")
      );
      shirt.position.y = 1.35;
      avatar.add(shirt);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 20, 16), mat("#d5a17f")
      );
      head.position.y = 2.1;
      avatar.add(head);

      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.29, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
        mat("#29242b")
      );
      hair.position.y = 2.22;
      avatar.add(hair);

      for (const x of [-0.18, 0.18]) {
        const leg = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.12, 0.48, 4, 8), mat("#26334b")
        );
        leg.position.set(x, 0.57, 0);
        avatar.add(leg);
      }

      for (const x of [-0.48, 0.48]) {
        const arm = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.105, 0.48, 4, 8), mat("#d5a17f")
        );
        arm.position.set(x, 1.38, 0);
        arm.rotation.z = x < 0 ? 0.15 : -0.15;
        avatar.add(arm);
      }

      avatar.position.set(-2.0, 0, 0.0);
      avatar.rotation.y = -0.3;
      scene.add(avatar);

      resize();
      window.addEventListener("resize", resize);

      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        if (avatar) avatar.position.y = Math.sin(t * 1.5) * 0.025;
        if (ring) ring.rotation.z = Math.sin(t * 0.4) * 0.04;
        renderer.render(scene, camera);
      }
      animate();
    } catch (error) {
      console.error("3D initialization error:", error);
      notify("Could not start 3D graphics on this device.");
    }
  }

  function resize() {
    if (!renderer || !camera) return;
    const w = Math.max(sceneEl.clientWidth, 1);
    const h = Math.max(sceneEl.clientHeight, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function update3D() {
    // Improve the lighting as your studio grows.
    if (scene) {
      scene.background = new THREE.Color(
        game.studio >= 3 ? "#17213c" : "#101a2a"
      );
    }
  }

  render();
  init3D();
})();
