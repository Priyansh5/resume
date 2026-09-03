/* ==========================================================================
   Backgrounds — Matrix rain (global) + particle network (hero)
   ========================================================================== */
(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Matrix Rain (fixed, behind everything) ---------------- */
  function initMatrix() {
    var canvas = document.getElementById('matrix-canvas');
    if (!canvas || prefersReduced) return;
    var ctx = canvas.getContext('2d');
    var chars = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃABCDEF#$%&@<>[]{}=/';
    var fontSize = 15;
    var drops = [];
    var lastTime = 0;
    var frameInterval = 55; // ms between frames — smooth but not hyper

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var cols = Math.floor(canvas.width / fontSize);
      drops = new Array(cols);
      for (var i = 0; i < cols; i++) drops[i] = Math.random() * -60;
    }

    function draw(now) {
      requestAnimationFrame(draw);
      if (now - lastTime < frameInterval) return;
      lastTime = now;

      ctx.fillStyle = 'rgba(7, 11, 20, 0.09)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + 'px "JetBrains Mono", monospace';

      for (var i = 0; i < drops.length; i++) {
        var ch = chars.charAt(Math.floor(Math.random() * chars.length));
        // head of the trail is brighter
        ctx.fillStyle = 'rgba(0, 255, 65, 0.9)';
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        ctx.fillStyle = 'rgba(0, 255, 65, 0.28)';
        ctx.fillText(chars.charAt(Math.floor(Math.random() * chars.length)), i * fontSize, (drops[i] - 1) * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
  }

  /* ---------------- Particle Network (hero only) ---------------- */
  function initParticles() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas || prefersReduced) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouse = { x: null, y: null, radius: 130 };
    var lastTime = 0;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      buildParticles();
    }

    function buildParticles() {
      particles = [];
      var count = Math.min(70, Math.floor(canvas.width * canvas.height / 16000));
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.8 + 0.8
        });
      }
    }

    function step(now) {
      requestAnimationFrame(step);
      if (now - lastTime < 24) return;
      lastTime = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // mouse repel (gentle)
        if (mouse.x !== null) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius && dist > 0) {
            var force = (mouse.radius - dist) / mouse.radius;
            p.x += (dx / dist) * force * 1.6;
            p.y += (dy / dist) * force * 1.6;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 65, 0.55)';
        ctx.fill();
      }

      // connect nearby particles
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var pa = particles[a], pb = particles[b];
          var dx = pa.x - pb.x, dy = pa.y - pb.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 255, 65, ' + (0.14 * (1 - d / 110)) + ')';
            ctx.lineWidth = 1;
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }
    }

    var hero = canvas.parentElement;
    hero.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () { mouse.x = null; mouse.y = null; });

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(step);
  }

  initMatrix();
  initParticles();
})();
