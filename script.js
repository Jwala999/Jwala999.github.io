(function () {
  const root = document.documentElement;
  const themeToggle = document.querySelector('#theme-toggle');
  const menuToggle = document.querySelector('#menu-toggle');
  const nav = document.querySelector('#primary-nav');
  const year = document.querySelector('#current-year');
  const reducedMotion = false; // Forced to false so you can see the animations!

  year.textContent = String(new Date().getFullYear());

  const savedTheme = localStorage.getItem('jwala-portfolio-theme');
  if (savedTheme === 'light') root.setAttribute('data-theme', 'light');

  themeToggle.addEventListener('click', function () {
    const isLight = root.getAttribute('data-theme') === 'light';
    root.toggleAttribute('data-theme', !isLight);
    if (isLight) root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', 'light');
    localStorage.setItem('jwala-portfolio-theme', isLight ? 'dark' : 'light');
  });

  menuToggle.addEventListener('click', function () {
    const open = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((item) => revealObserver.observe(item));
  } else {
    reveals.forEach((item) => item.classList.add('is-visible'));
  }

  const counters = document.querySelectorAll('[data-counter]');
  if ('IntersectionObserver' in window && counters.length) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = Number(entry.target.dataset.counter);
        const start = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - start) / 900, 1);
          entry.target.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3)))) + (target === 3 ? 's' : '+');
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.65 });
    counters.forEach((item) => counterObserver.observe(item));
  }

  if (!reducedMotion) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.transform = `perspective(1200px) rotateX(${y * -2.2}deg) rotateY(${x * 2.2}deg) translateY(-4px)`;
        const visual = card.querySelector('.project-visual, .chat-visual, .mini-terminal');
        if (visual) {
          visual.style.transform = `translateX(${x * 20}px) translateY(${y * 20}px)`;
          visual.style.transition = 'none';
        }
      });
      card.addEventListener('pointerleave', () => { 
        card.style.transform = ''; 
        const visual = card.querySelector('.project-visual, .chat-visual, .mini-terminal');
        if (visual) {
          visual.style.transform = '';
          visual.style.transition = 'transform 0.5s var(--ease)';
        }
      });
    });
  }

  // Three.js Integration
  if (typeof THREE !== 'undefined' && !reducedMotion) {
    const canvas = document.querySelector('#particle-field');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 30;

    // Particles setup (Wave/Neural net aesthetic)
    const particleCount = window.innerWidth < 768 ? 400 : 900;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorMint = new THREE.Color('#56e3b4');
    const colorGold = new THREE.Color('#f3c770');
    const colorViolet = new THREE.Color('#a794ff');

    for (let i = 0; i < particleCount; i++) {
      // Spread them across a wide area
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 50;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Mix colors
      const rand = Math.random();
      let mixedColor = colorMint.clone();
      if (rand > 0.8) mixedColor = colorGold.clone();
      else if (rand > 0.6) mixedColor = colorViolet.clone();
      
      mixedColor.toArray(colors, i * 3);
      sizes[i] = Math.random() * 2.0 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for glowing dots
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        isLight: { value: root.getAttribute('data-theme') === 'light' ? 1.0 : 0.0 }
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        void main() {
          vColor = customColor;
          vec3 pos = position;
          // Subtle wave motion
          pos.y += sin(time * 0.5 + pos.x * 0.1) * 2.0;
          pos.z += cos(time * 0.3 + pos.y * 0.1) * 2.0;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float isLight;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (0.5 - dist) * 2.0;
          // Adjust opacity based on theme
          float finalAlpha = mix(alpha * 0.6, alpha * 0.3, isLight);
          gl_FragColor = vec4(vColor, finalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particlesSystem = new THREE.Points(geometry, material);
    scene.add(particlesSystem);

    // Opening animation (scattered to ordered)
    let openingProgress = 0;
    const openingSpeed = 0.015;

    // Interaction variables
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-9999, -9999);
    let targetCameraY = 0;
    let clickTime = 0;
    let clickPos = new THREE.Vector3();

    // Mouse tracking for hover
    window.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Scroll tracking for parallax
    window.addEventListener('scroll', () => {
      targetCameraY = -(window.scrollY * 0.015);
    });

    // Click effect (Shockwave)
    window.addEventListener('click', (event) => {
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.at(30, clickPos); 
      clickTime = performance.now();
    });

    // Handle theme toggle inside Three.js
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          material.uniforms.isLight.value = root.getAttribute('data-theme') === 'light' ? 1.0 : 0.0;
        }
      });
    });
    observer.observe(root, { attributes: true });

    // Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      
      material.uniforms.time.value = time;

      // Smooth camera scroll
      camera.position.y += (targetCameraY - camera.position.y) * 0.05;

      // Opening effect (lerp positions)
      if (openingProgress < 1) {
        openingProgress += openingSpeed;
        camera.position.z = 100 - (openingProgress * 70); // fly in from z=100 to z=30
        particlesSystem.rotation.y = (1 - openingProgress) * Math.PI; // Spin in
      }

      // Hover and Click physics
      const positionsAttr = geometry.attributes.position;
      const posArray = positionsAttr.array;
      
      // Map mouse to 3D space loosely at z=0 plane
      let mouse3D = new THREE.Vector3(mouse.x * 35, mouse.y * 20 + camera.position.y, 0);
      
      const currentTime = performance.now();
      const timeSinceClick = (currentTime - clickTime) / 1000.0;
      let shockwaveRadius = 0;
      if (timeSinceClick < 2.0) {
        shockwaveRadius = timeSinceClick * 30.0; // expand outwards
      }

      for (let i = 0; i < particleCount; i++) {
        let px = originalPositions[i * 3];
        let py = originalPositions[i * 3 + 1];
        let pz = originalPositions[i * 3 + 2];
        
        let particlePos = new THREE.Vector3(px, py, pz);
        
        // Hover repulsion
        let distToMouse = particlePos.distanceTo(mouse3D);
        if (distToMouse < 10) {
          let force = (10 - distToMouse) / 10;
          let dir = particlePos.clone().sub(mouse3D).normalize();
          px += dir.x * force * 8;
          py += dir.y * force * 8;
          pz += dir.z * force * 8;
        }

        // Click shockwave
        if (timeSinceClick < 2.0) {
          let distToClick = particlePos.distanceTo(clickPos);
          let diff = Math.abs(distToClick - shockwaveRadius);
          if (diff < 5) { // Shell thickness
            let force = (5 - diff) / 5; // 0 to 1
            let dir = particlePos.clone().sub(clickPos).normalize();
            // push outwards
            px += dir.x * force * 15;
            py += dir.y * force * 15;
            pz += dir.z * force * 15;
          }
        }

        // Smoothly return to original positions
        posArray[i * 3] += (px - posArray[i * 3]) * 0.1;
        posArray[i * 3 + 1] += (py - posArray[i * 3 + 1]) * 0.1;
        posArray[i * 3 + 2] += (pz - posArray[i * 3 + 2]) * 0.1;
      }
      
      positionsAttr.needsUpdate = true;

      // Slow rotation for the whole system
      particlesSystem.rotation.x += 0.0005;
      particlesSystem.rotation.y += 0.001;

      renderer.render(scene, camera);
    }

    animate();
  }
})();
