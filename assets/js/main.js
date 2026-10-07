/* Agenvas landing page — progressive enhancements */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var args = arguments;
      window.clearTimeout(t);
      t = window.setTimeout(function () {
        fn.apply(null, args);
      }, wait);
    };
  }

  /* ------------------------------------------------------------------ *
   * Nav: glass background once scrolled
   * ------------------------------------------------------------------ */
  (function nav() {
    var el = document.getElementById("nav");
    if (!el) return;
    var update = function () {
      el.classList.toggle("is-stuck", window.scrollY > 8);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  })();

  /* ------------------------------------------------------------------ *
   * Scroll reveal
   * ------------------------------------------------------------------ */
  (function reveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );

    Array.prototype.forEach.call(items, function (el) {
      io.observe(el);
    });
  })();

  /* ------------------------------------------------------------------ *
   * Copy-to-clipboard for terminal blocks
   * ------------------------------------------------------------------ */
  (function copyButtons() {
    function write(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.top = "-1000px";
        document.body.appendChild(area);
        area.select();
        try {
          var ok = document.execCommand("copy");
          document.body.removeChild(area);
          ok ? resolve() : reject(new Error("execCommand failed"));
        } catch (err) {
          document.body.removeChild(area);
          reject(err);
        }
      });
    }

    Array.prototype.forEach.call(
      document.querySelectorAll("[data-copy]"),
      function (btn) {
        btn.addEventListener("click", function () {
          var term = btn.closest(".term");
          var pre = term && term.querySelector("pre");
          if (!pre) return;

          var clone = pre.cloneNode(true);
          Array.prototype.forEach.call(
            clone.querySelectorAll(".prompt"),
            function (node) {
              node.parentNode.removeChild(node);
            }
          );
          var text = clone.textContent.replace(/\s+$/, "");
          var label = btn.querySelector("[data-copy-label]");

          var flash = function (message) {
            if (label) label.textContent = message;
            window.setTimeout(function () {
              btn.classList.remove("is-copied");
              if (label) label.textContent = "Copy";
            }, 2000);
          };

          write(text).then(
            function () {
              btn.classList.add("is-copied");
              flash("Copied");
            },
            function () {
              flash("Copy manually");
            }
          );
        });
      }
    );
  })();

  /* ------------------------------------------------------------------ *
   * Tabs (quick-start OS switcher)
   * ------------------------------------------------------------------ */
  (function tabs() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[role="tablist"]'),
      function (list) {
        var items = Array.prototype.slice.call(
          list.querySelectorAll('[role="tab"]')
        );

        function select(tab, moveFocus) {
          items.forEach(function (item) {
            var isSelected = item === tab;
            item.setAttribute("aria-selected", isSelected ? "true" : "false");
            item.tabIndex = isSelected ? 0 : -1;
            var panel = document.getElementById(
              item.getAttribute("aria-controls")
            );
            if (panel) panel.hidden = !isSelected;
          });
          if (moveFocus) tab.focus();
        }

        items.forEach(function (tab) {
          tab.addEventListener("click", function () {
            select(tab, false);
          });
          tab.addEventListener("keydown", function (event) {
            var index = items.indexOf(tab);
            var next = null;
            if (event.key === "ArrowRight") next = items[(index + 1) % items.length];
            else if (event.key === "ArrowLeft")
              next = items[(index - 1 + items.length) % items.length];
            else if (event.key === "Home") next = items[0];
            else if (event.key === "End") next = items[items.length - 1];
            if (!next) return;
            event.preventDefault();
            select(next, true);
          });
        });
      }
    );
  })();

  /* ------------------------------------------------------------------ *
   * Canvas mock: draw connector curves between node cards
   * ------------------------------------------------------------------ */
  (function stageLinks() {
    var stage = document.querySelector(".stage");
    var svg = document.getElementById("stage-links");
    if (!stage || !svg) return;

    var SVG_NS = "http://www.w3.org/2000/svg";
    var PAIRS = [
      ["prompt", "text"],
      ["text", "image"],
      ["image", "video"],
      ["prompt", "agent"],
      ["agent", "audio"]
    ];
    var lastW = 0;
    var lastH = 0;
    var drawn = false;

    function box(rect, origin) {
      return {
        l: rect.left - origin.left,
        t: rect.top - origin.top,
        r: rect.right - origin.left,
        b: rect.bottom - origin.top,
        cx: (rect.left + rect.right) / 2 - origin.left,
        cy: (rect.top + rect.bottom) / 2 - origin.top
      };
    }

    function addPath(d, cls) {
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("class", cls);
      path.setAttribute("fill", "none");
      svg.appendChild(path);
      return path;
    }

    function draw(force) {
      var origin = stage.getBoundingClientRect();
      if (!origin.width || !origin.height) return;
      if (
        drawn &&
        !force &&
        Math.abs(origin.width - lastW) < 0.5 &&
        Math.abs(origin.height - lastH) < 0.5
      ) {
        return;
      }
      lastW = origin.width;
      lastH = origin.height;

      svg.setAttribute("viewBox", "0 0 " + origin.width + " " + origin.height);
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      PAIRS.forEach(function (pair) {
        var from = stage.querySelector(".node--" + pair[0]);
        var to = stage.querySelector(".node--" + pair[1]);
        if (!from || !to) return;
        if (from.offsetParent === null || to.offsetParent === null) return;

        var a = box(from.getBoundingClientRect(), origin);
        var b = box(to.getBoundingClientRect(), origin);
        var d;
        var x1, y1, x2, y2;

        if (b.cx - a.cx > 24) {
          d = "h";
          x1 = a.r + 5;
          y1 = a.cy;
          x2 = b.l - 5;
          y2 = b.cy;
        } else if (a.cx - b.cx > 24) {
          d = "h";
          x1 = a.l - 5;
          y1 = a.cy;
          x2 = b.r + 5;
          y2 = b.cy;
        } else if (b.cy > a.cy) {
          d = "v";
          x1 = a.cx;
          y1 = a.b + 5;
          x2 = b.cx;
          y2 = b.t - 5;
        } else {
          d = "v";
          x1 = a.cx;
          y1 = a.t - 5;
          x2 = b.cx;
          y2 = b.b + 5;
        }

        var d1;
        if (d === "h") {
          var mx = (x1 + x2) / 2;
          d1 =
            "M" + x1 + " " + y1 + " C" + mx + " " + y1 + " " + mx + " " + y2 + " " + x2 + " " + y2;
        } else {
          var my = (y1 + y2) / 2;
          d1 =
            "M" + x1 + " " + y1 + " C" + x1 + " " + my + " " + x2 + " " + my + " " + x2 + " " + y2;
        }

        addPath(d1, "stage__link");
        addPath(d1, "stage__link stage__link--flow");
      });

      if (drawn || reduceMotion.matches) return;
      drawn = true;

      Array.prototype.forEach.call(
        svg.querySelectorAll(".stage__link:not(.stage__link--flow)"),
        function (path) {
          var length = path.getTotalLength();
          if (!length) return;
          path.style.strokeDasharray = length;
          path.style.strokeDashoffset = length;
          path.getBoundingClientRect();
          path.style.transition =
            "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)";
          path.style.strokeDashoffset = "0";
          window.setTimeout(function () {
            path.style.strokeDasharray = "";
          }, 1100);
        }
      );
    }

    draw(true);

    if ("ResizeObserver" in window) {
      new ResizeObserver(debounce(function () {
        draw(false);
      }, 200)).observe(stage);
    } else {
      window.addEventListener("resize", debounce(function () {
        draw(false);
      }, 200));
    }

    window.addEventListener("load", function () {
      draw(true);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        draw(true);
      });
    }
  })();

  /* ------------------------------------------------------------------ *
   * Hero background: drifting node graph
   * ------------------------------------------------------------------ */
  (function heroCanvas() {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var host = canvas.parentElement;
    var width = 0;
    var height = 0;
    var points = [];
    var frame = null;
    var running = false;
    var inView = true;
    var pointer = { x: 0, y: 0, active: false };
    var LINK = 132;
    var PULL = 150;

    function build() {
      var count = Math.round(Math.min(84, Math.max(24, (width * height) / 20000)));
      points = [];
      for (var i = 0; i < count; i++) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          r: 0.7 + Math.random() * 1.4
        });
      }
    }

    function resize() {
      var rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      return true;
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      var i;
      var j;
      for (i = 0; i < points.length; i++) {
        var p = points[i];
        for (j = i + 1; j < points.length; j++) {
          var q = points[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var dist2 = dx * dx + dy * dy;
          if (dist2 > LINK * LINK) continue;
          var alpha = (1 - Math.sqrt(dist2) / LINK) * 0.32;
          ctx.strokeStyle = "rgba(34,197,94," + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      for (i = 0; i < points.length; i++) {
        var node = points[i];

        if (pointer.active) {
          var mdx = node.x - pointer.x;
          var mdy = node.y - pointer.y;
          var md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < PULL && md > 0.5) {
            node.vx += (mdx / md) * 0.014;
            node.vy += (mdy / md) * 0.014;
          }
        }

        node.vx *= 0.994;
        node.vy *= 0.994;
        var speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > 0.62) {
          node.vx = (node.vx / speed) * 0.62;
          node.vy = (node.vy / speed) * 0.62;
        }

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -24) node.x = width + 24;
        else if (node.x > width + 24) node.x = -24;
        if (node.y < -24) node.y = height + 24;
        else if (node.y > height + 24) node.y = -24;

        ctx.fillStyle = "rgba(148,163,184,0.5)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      render();
      frame = window.requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion.matches) return;
      running = true;
      frame = window.requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
      frame = null;
    }

    if (!resize()) {
      window.addEventListener("load", function () {
        resize();
        if (reduceMotion.matches) render();
      });
    }

    if (reduceMotion.matches) render();
    else start();

    window.addEventListener(
      "resize",
      debounce(function () {
        resize();
        if (reduceMotion.matches) render();
      }, 200)
    );

    host.addEventListener("pointermove", function (event) {
      var rect = host.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });

    host.addEventListener("pointerleave", function () {
      pointer.active = false;
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          inView = entries[0].isIntersecting;
          if (inView) start();
          else stop();
        },
        { threshold: 0 }
      ).observe(host);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (inView) start();
    });
  })();
})();
