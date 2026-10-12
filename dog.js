// The home page dog. Her mood comes from the visitor's own clock: asleep at
// night, awake the rest of the day. Awake, she wanders along the bottom of
// the page with a proper four-beat dog walk, stops to sniff or look at you,
// and turns round to wander somewhere else. Nothing is sent anywhere.
// Add ?dog=sleepy or ?dog=playful to the URL to see a mood on demand.
(function () {
  var dog = document.querySelector(".dog");
  if (!dog) return;

  var forced = new URLSearchParams(location.search).get("dog");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Leg geometry, in the SVG's own units. Each leg is two segments of equal
  // length, posed with two-bone IK so the paw lands exactly where we want.
  var UPPER = 21;
  var LOWER = 21;
  var GROUND = 91;

  // Walk cycle. A paw spends DUTY of the cycle planted while the body moves
  // over it, so the body speed below keeps planted paws from sliding.
  var STRIDE = 26;
  var LIFT = 6;
  var PERIOD = 0.9;
  var DUTY = 0.62;
  var SPEED = STRIDE / (DUTY * PERIOD);

  var walkPose = dog.querySelector(".pose-walk");
  var body = walkPose.querySelector(".walk-body");
  var head = walkPose.querySelector(".head");
  var tail = walkPose.querySelector(".tail");
  var legs = Array.prototype.map.call(walkPose.querySelectorAll(".leg"), function (g) {
    var hip = g.dataset.hip.split(" ").map(Number);
    return {
      hx: hip[0],
      hy: hip[1],
      back: g.dataset.kind === "back",
      phase: Number(g.dataset.phase),
      offset: Number(g.dataset.offset),
      // Each leg is drawn twice, outline then fur, so the knee has no seam.
      upper: g.querySelectorAll(".seg-upper"),
      lower: g.querySelectorAll(".seg-lower"),
    };
  });

  var DEG = 180 / Math.PI;

  function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
  }

  function rotate(els, angle, x, y) {
    var value = "rotate(" + angle.toFixed(2) + " " + x + " " + y + ")";
    if (!els.length) els = [els];
    for (var i = 0; i < els.length; i++) els[i].setAttribute("transform", value);
  }

  // Bend a leg so its paw sits at (fx, fy). Front legs fold forward at the
  // wrist; back legs fold backward at the hock, like a real dog's.
  function placeLeg(leg, fx, fy) {
    var dx = fx - leg.hx;
    var dy = fy - leg.hy;
    var reach = clamp(Math.hypot(dx, dy), 1, UPPER + LOWER - 0.01);
    var toPaw = Math.atan2(dx, dy);
    var bend = Math.acos(
      clamp((UPPER * UPPER + reach * reach - LOWER * LOWER) / (2 * UPPER * reach), -1, 1)
    );
    var upper = leg.back ? toPaw - bend : toPaw + bend;
    var kx = leg.hx + UPPER * Math.sin(upper);
    var ky = leg.hy + UPPER * Math.cos(upper);
    var lower = Math.atan2(fx - kx, fy - ky);
    rotate(leg.upper, -upper * DEG, leg.hx, leg.hy);
    rotate(leg.lower, -(lower - upper) * DEG, leg.hx, leg.hy + UPPER);
  }

  // Where a paw is, relative to its hip, at point p (0 to 1) of the cycle.
  function pawAt(p, stride, lift) {
    if (p < DUTY) return [stride / 2 - stride * (p / DUTY), 0];
    var u = (p - DUTY) / (1 - DUTY);
    var eased = u * u * (3 - 2 * u);
    return [-stride / 2 + stride * eased, -lift * Math.sin(Math.PI * u)];
  }

  // State. x is in CSS pixels from the left of the stage; facing is 1 for
  // right and -1 for left; walk (0 to 1) eases her in and out of a stride.
  var x = null;
  var facing = 1;
  var flip = 1;
  var walk = 0;
  var phase = 0;
  var clock = 0;
  var state = "idle";
  var timer = 1;
  var target = 0;
  var idleKind = "look";
  var turnProgress = 0;
  var headAngle = 0;
  var running = false;
  var frame = 0;
  var last = 0;

  function bounds() {
    var width = dog.offsetWidth;
    var stage = dog.parentElement.clientWidth;
    return { min: 8, max: Math.max(8, stage - width - 8), scale: width / 140 };
  }

  function pickTarget(b) {
    var span = b.max - b.min;
    var next = x;
    for (var i = 0; i < 12 && Math.abs(next - x) < span * 0.3; i++) {
      next = b.min + Math.random() * span;
    }
    return next;
  }

  function pose(bob) {
    for (var i = 0; i < legs.length; i++) {
      var leg = legs[i];
      var paw = pawAt((phase + leg.phase) % 1, STRIDE * walk, LIFT * walk);
      placeLeg(leg, leg.hx + leg.offset + paw[0], GROUND - bob + paw[1]);
    }
  }

  function step(dt) {
    clock += dt;
    var b = bounds();
    if (x === null) x = b.min + Math.random() * (b.max - b.min);
    x = clamp(x, b.min, b.max);

    var striding = false;
    if (state === "idle") {
      timer -= dt;
      if (timer <= 0) {
        target = pickTarget(b);
        var dir = target > x ? 1 : -1;
        if (dir !== facing) {
          state = "turn";
          turnProgress = 0;
        } else {
          state = "walk";
        }
      }
    } else if (state === "turn") {
      turnProgress = Math.min(turnProgress + dt / 0.35, 1);
      flip = facing * Math.cos(Math.PI * turnProgress);
      if (turnProgress === 1) {
        facing = -facing;
        flip = facing;
        state = "walk";
      }
    } else if (state === "walk") {
      // Start slowing early enough to stop right on the spot she picked.
      var remaining = (target - x) * facing;
      var braking = (SPEED * b.scale * walk) / (2 * 2.5);
      striding = remaining > braking + 1;
      if (!striding && walk === 0) {
        state = "idle";
        timer = 2 + Math.random() * 3.5;
        idleKind = Math.random() < 0.5 ? "sniff" : "look";
      }
    }

    walk = clamp(walk + (striding ? 1 : -1) * dt * 2.5, 0, 1);
    if (walk > 0) phase = (phase + dt / PERIOD) % 1;
    x += facing * SPEED * walk * b.scale * dt;

    // Body, head and tail follow the gait while walking, and the idle
    // behaviour while standing.
    var bob = walk * 0.9 * Math.sin(4 * Math.PI * phase);
    var headTarget = walk * 2.5 * Math.sin(4 * Math.PI * phase + 1);
    var tailAngle = walk * 8 * Math.sin(2 * Math.PI * phase);
    if (state === "idle") {
      if (idleKind === "sniff") {
        headTarget = 24 + 3 * Math.sin(clock * 16);
        tailAngle = 8 * Math.sin(clock * 2 * Math.PI * 1.2);
      } else {
        headTarget = -6;
        tailAngle = 20 * Math.sin(clock * 2 * Math.PI * 3);
      }
    }
    headAngle += (headTarget - headAngle) * Math.min(1, dt * 7);

    body.setAttribute("transform", "translate(0 " + bob.toFixed(2) + ")");
    rotate(head, headAngle, 104, 24);
    rotate(tail, tailAngle, 39, 44);
    pose(bob);
    dog.style.transform = "translateX(" + x.toFixed(1) + "px) scaleX(" + flip.toFixed(3) + ")";
  }

  function loop(now) {
    if (!running) return;
    step(Math.min((now - last) / 1000, 0.1));
    last = now;
    frame = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduceMotion.matches) return;
    running = true;
    // Place her before the first frame so she doesn't flash at the left edge.
    step(0);
    dog.classList.add("is-walking");
    last = performance.now();
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
    dog.classList.remove("is-walking");
    dog.style.transform = "";
  }

  function update() {
    var mood = forced === "sleepy" || forced === "playful" ? forced : null;
    if (!mood) {
      var hour = new Date().getHours();
      mood = hour >= 22 || hour < 7 ? "sleepy" : "playful";
    }
    dog.dataset.mood = mood;
    if (mood === "playful") start();
    else stop();
  }

  // Stand her up properly even when she isn't walking.
  pose(0);
  update();
  // A page left open overnight should notice bedtime.
  setInterval(update, 60 * 1000);
  reduceMotion.addEventListener("change", function () {
    if (reduceMotion.matches) stop();
    else update();
  });
})();
