import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowUpRight,
  Sparkles,
  Layers,
  Wand2,     // Ensure Wand2 is explicitly written here
  Smartphone,
  Code2,
  Zap,
  Menu,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Hook: magnetic pull — element follows cursor within a radius, snaps back
// ---------------------------------------------------------------------------
function useMagnetic(strength = 0.4) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMouseMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      setPos({ x: relX * strength, y: relY * strength });
    },
    [strength]
  );

  const onMouseLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);

  return { ref, pos, onMouseMove, onMouseLeave };
}

// ---------------------------------------------------------------------------
// Hook: 3D tilt based on cursor position within element
// ---------------------------------------------------------------------------
function useTilt(max = 8) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 });

  const onMouseMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      setTilt({
        rx: (0.5 - py) * max,
        ry: (px - 0.5) * max,
        mx: px * 100,
        my: py * 100,
      });
    },
    [max]
  );

  const onMouseLeave = useCallback(
    () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50 }),
    []
  );

  return { ref, tilt, onMouseMove, onMouseLeave };
}

/**
 * STUDIO — Premium agency landing page
 * React + Tailwind, motion implemented with native CSS transitions/animations
 * + IntersectionObserver / scroll listeners (drop-in replacement for the
 * framer-motion behaviors requested: staggered reveal, sticky/parallax scroll,
 * gradient-border hover, scroll-aware navbar).
 */

// ---------------------------------------------------------------------------
// Hook: reveal-on-scroll using IntersectionObserver
// ---------------------------------------------------------------------------
function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

// ---------------------------------------------------------------------------
// Hook: track scroll progress (0 -> 1) across a given element's height
// ---------------------------------------------------------------------------
function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // total scrollable distance through the pinned section
      const total = rect.height - vh;
      if (total <= 0) return;
      const scrolled = -rect.top;
      const p = Math.min(1, Math.max(0, scrolled / total));
      setProgress(p);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref]);

  return progress;
}

// ---------------------------------------------------------------------------
// Custom cursor — dot + lagging ring, expands over interactive elements
// ---------------------------------------------------------------------------
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  const [hidden, setHidden] = useState(true);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only enable on devices with a real pointer (skip touch)
    if (window.matchMedia && !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (hidden) setHidden(false);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
      const target = e.target;
      setHovering(!!target.closest("[data-cursor-hover]"));
    };

    let raf;
    const animateRing = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.18;
      ring.current.y += (pos.current.y - ring.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animateRing);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(animateRing);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [hidden]);

  if (typeof window !== "undefined" && window.matchMedia && !window.matchMedia("(pointer: fine)").matches) {
    return null;
  }

  return (
    <div className={`pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}>
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-amber-300"
        style={{ willChange: "transform" }}
      />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 rounded-full border border-amber-300/40 transition-[width,height,border-color,background-color] duration-300 ease-out"
        style={{
          width: hovering ? 56 : 28,
          height: hovering ? 56 : 28,
          backgroundColor: hovering ? "rgba(252,211,77,0.08)" : "transparent",
          willChange: "transform",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating ambient particles for the hero
// ---------------------------------------------------------------------------
function FloatingParticles({ count = 22 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      duration: Math.random() * 14 + 12,
      delay: Math.random() * 10,
      drift: (Math.random() - 0.5) * 60,
      opacity: Math.random() * 0.35 + 0.15,
    }))
  ).current;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-amber-300"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-up {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: var(--o, 0.3); }
          90% { opacity: var(--o, 0.3); }
          100% { transform: translate(var(--drift), -110vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Magnetic button wrapper
// ---------------------------------------------------------------------------
function MagneticButton({ children, className = "", as: Tag = "a", ...props }) {
  const { ref, pos, onMouseMove, onMouseLeave } = useMagnetic(0.3);
  return (
    <Tag
      ref={ref}
      data-cursor-hover
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 0.2s cubic-bezier(0.33,1,0.68,1)",
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Navbar — floating pill, glassmorphism, detaches on scroll
// ---------------------------------------------------------------------------
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Work", "Studio", "Services", "Pricing"];

  return (
    <div
      className={`fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ease-out ${
        scrolled ? "top-3 w-[96%] max-w-4xl" : "top-6 w-[94%] max-w-5xl"
      }`}
    >
      <nav
        className={`flex items-center justify-between rounded-full border border-amber-400/15 px-5 py-2.5 backdrop-blur-xl transition-all duration-500 ${
          scrolled
            ? "bg-black/70 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.8)]"
            : "bg-white/[0.03]"
        }`}
      >
        <a href="#top" data-cursor-hover className="flex items-center gap-2 pl-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-sm font-semibold tracking-tight text-white">
            STUDIO
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              data-cursor-hover
              className="text-sm text-neutral-400 transition-colors duration-300 hover:text-amber-300"
            >
              {l}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <MagneticButton
            href="#"
            className="group flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-4 py-2 text-sm font-medium text-black"
          >
            Let's talk
            <ArrowUpRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </MagneticButton>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          data-cursor-hover
          className="text-white md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="mt-2 flex flex-col gap-1 rounded-3xl border border-amber-400/15 bg-black/90 p-4 backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              className="rounded-xl px-3 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-amber-400/5 hover:text-amber-300"
            >
              {l}
            </a>
          ))}
          <a
            href="#"
            className="mt-1 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 px-3 py-2.5 text-center text-sm font-medium text-black"
          >
            Let's talk
          </a>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero — staggered bottom-up reveal, aurora glow background
// ---------------------------------------------------------------------------
function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const words = ["Create", "at", "the", "Highest", "Level"];

  return (
    <section
  id="top"
  className="relative flex h-screen min-h-[640px] w-full flex-col items-center justify-center pt-24 overflow-hidden bg-black px-6"
>
      {/* Aurora glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-500/20 via-yellow-600/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[400px] w-[500px] rounded-full bg-gradient-to-tl from-amber-400/10 to-transparent blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <FloatingParticles count={24} />

      {/* Eyebrow */}
      <div
        className={`relative mb-6 flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.04] px-4 py-1.5 backdrop-blur-md transition-all duration-700 ease-out ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Sparkles size={13} className="text-amber-300" />
        <span className="text-xs font-medium text-amber-200/90">
          Award-winning design, engineered
        </span>
      </div>

      {/* Headline — staggered word reveal */}
      <h1 className="relative max-w-5xl text-center text-[13vw] font-semibold leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[7rem]">
        {words.map((w, i) => (
          <span key={w} className="mr-3 inline-block overflow-hidden align-bottom last:mr-0">
            <span
              className="inline-block transition-all ease-out"
              style={{
                transitionDuration: "800ms",
                transitionDelay: `${150 + i * 90}ms`,
                transform: mounted ? "translateY(0%)" : "translateY(110%)",
                opacity: mounted ? 1 : 0,
              }}
            >
              {w === "Highest" ? (
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  {w}
                </span>
              ) : (
                w
              )}
            </span>
          </span>
        ))}
      </h1>

      <p
        className={`relative mt-7 max-w-xl text-center text-base text-neutral-400 transition-all duration-700 ease-out sm:text-lg ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
        style={{ transitionDelay: "650ms" }}
      >
        A design studio crafting bold digital experiences — where motion,
        typography, and code meet at their highest resolution.
      </p>

      <div
        className={`relative mt-10 flex flex-col items-center gap-4 transition-all duration-700 ease-out sm:flex-row ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
        style={{ transitionDelay: "780ms" }}
      >
        <MagneticButton
          href="#work"
          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-6 py-3.5 text-sm font-medium text-black shadow-[0_0_40px_-8px_rgba(245,180,60,0.5)]"
        >
          Start creating
          <ArrowUpRight
            size={15}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </MagneticButton>
        <MagneticButton
          href="#features"
          className="rounded-full border border-amber-400/25 px-6 py-3.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-amber-400/5"
        >
          Explore features
        </MagneticButton>
      </div>

      {/* Scroll cue */}
      <div
        className={`absolute bottom-10 flex flex-col items-center gap-2 transition-opacity duration-700 ${
          mounted ? "opacity-60" : "opacity-0"
        }`}
        style={{ transitionDelay: "1000ms" }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          Scroll
        </span>
        <div className="h-9 w-[1px] animate-pulse bg-gradient-to-b from-amber-400/60 to-transparent" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Bento card with gradient border reveal on hover
// ---------------------------------------------------------------------------
function BentoCard({ icon: Icon, title, desc, className = "", big = false }) {
  const [hover, setHover] = useState(false);
  const [ref, visible] = useReveal(0.15);
  const { ref: tiltRef, tilt, onMouseMove, onMouseLeave } = useTilt(6);

  const setRefs = (el) => {
    ref.current = el;
    tiltRef.current = el;
  };

  return (
    <div
      ref={setRefs}
      data-cursor-hover
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        onMouseLeave();
      }}
      onMouseMove={onMouseMove}
      className={`group relative overflow-hidden rounded-3xl border border-amber-400/10 bg-neutral-950 p-7 transition-[opacity,transform] duration-700 ease-out ${className} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{
        transform: visible
          ? `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hover ? 1.015 : 1})`
          : undefined,
        transition: "transform 0.15s ease-out, opacity 0.7s ease-out",
      }}
    >
      {/* cursor-tracking spotlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: hover ? 1 : 0,
          background: `radial-gradient(280px circle at ${tilt.mx}% ${tilt.my}%, rgba(245,180,60,0.1), transparent 70%)`,
        }}
      />
      {/* gradient border reveal */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500"
        style={{
          opacity: hover ? 1 : 0,
          padding: 1,
          background: `radial-gradient(220px circle at ${tilt.mx}% ${tilt.my}%, rgba(252,211,77,0.6), rgba(252,211,77,0) 70%)`,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      <div className="relative flex h-full flex-col justify-between gap-8" style={{ transform: "translateZ(20px)" }}>
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/5 transition-transform duration-500 group-hover:scale-110 group-hover:bg-amber-400/10">
            <Icon size={18} className="text-amber-300" />
          </div>
          <ArrowUpRight
            size={16}
            className="text-neutral-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-300"
          />
        </div>
        <div>
          <h3
            className={`font-semibold tracking-tight text-white ${
              big ? "text-2xl" : "text-lg"
            }`}
          >
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

function BentoSection() {
  const [headRef, headVisible] = useReveal(0.3);

  return (
    <section id="features" className="relative bg-black px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <div
  ref={headRef}
  className={`mx-auto mb-16 flex max-w-xl flex-col items-center text-center transition-all duration-700 ease-out ${
    headVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
  }`}
>
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-amber-400/70">
            Capabilities
          </span>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Everything, engineered for impact.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <BentoCard
            icon={Wand2}
            title="Advanced Animations"
            desc="Choreographed motion systems built for performance — every interaction tuned to feel inevitable."
            className="lg:col-span-2 lg:row-span-1"
            big
          />
          <BentoCard
            icon={Smartphone}
            title="Responsive Design"
            desc="Pixel-perfect across every breakpoint, from ultra-wide to mobile."
          />
          <BentoCard
            icon={Code2}
            title="Custom CSS"
            desc="Hand-tuned styling systems — no bloated frameworks, just precision."
          />
          <BentoCard
            icon={Layers}
            title="Component Systems"
            desc="Modular, scalable design systems that grow with your product."
          />
          <BentoCard
            icon={Zap}
            title="Blazing Performance"
            desc="60fps animations, sub-second loads, and lighthouse scores that matter."
            className="lg:col-span-1"
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sticky / parallax scroll experience section
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Sticky / parallax scroll experience section (Fixed Layout)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Sticky / parallax scroll experience section (Stacked Layout with Gap)
// ---------------------------------------------------------------------------
function ScrollExperience() {
  const containerRef = useRef(null);
  const progress = useScrollProgress(containerRef);

  const blocks = [
    {
      n: "01",
      title: "Concept",
      copy: "Every project begins with a deep dive — understanding the brand, the audience, and the ambition behind it.",
    },
    {
      n: "02",
      title: "Craft",
      copy: "We design and build in tandem, treating motion and code as one continuous material.",
    },
    {
      n: "03",
      title: "Launch",
      copy: "Pixel-perfect, performance-obsessed, and ready to scale — from first visit to final pixel.",
    },
  ];

  const activeIndex = Math.min(
    blocks.length - 1,
    Math.floor(progress * blocks.length)
  );

  // Gentle scale effect for the visual below
  const imgScale = 1 + progress * 0.10;

  return (
    <section ref={containerRef} className="relative bg-black" style={{ height: "300vh" }}>
      {/* Added explicit gap (gap-10 sm:gap-16) and centered them securely */}
      <div className="sticky top-0 flex h-[100dvh] w-full flex-col items-center justify-center gap-10 sm:gap-16 overflow-hidden pt-28 pb-10 px-6">
        
        {/* Top Half: The Active Text Card (Locked to 30% of screen height) */}
        <div className="relative w-full max-w-2xl h-[30vh] sm:h-[35vh] flex items-center justify-center">
          {blocks.map((b, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={b.n}
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-700 ease-out"
                style={{ 
                  opacity: isActive ? 1 : 0, 
                  transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                  pointerEvents: isActive ? 'auto' : 'none' 
                }}
              >
                <div className="w-full rounded-[2rem] border border-white/10 bg-neutral-900/40 p-8 backdrop-blur-xl shadow-2xl">
                  <span className="mb-3 block text-xs font-medium tracking-[0.3em] text-amber-400/80">
                    {b.n}
                  </span>
                  <h3 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                    {b.title}
                  </h3>
                  <p className="mx-auto mt-4 max-w-md text-sm sm:text-base leading-relaxed text-neutral-400">
                    {b.copy}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Half: The Pinned Visual (Locked to 40% of screen height) */}
        <div className="relative w-full max-w-4xl h-[40vh] sm:h-[45vh] flex items-center justify-center">
          <div
            className="relative h-full w-full overflow-hidden rounded-[2rem] border border-amber-400/20 shadow-[0_0_50px_-15px_rgba(252,211,77,0.15)]"
            style={{
              transform: `scale(${imgScale})`,
              transformOrigin: "bottom center",
              transition: "transform 0.05s linear",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 0%, rgba(252,211,77,0.25), transparent 70%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs sm:text-sm uppercase tracking-[0.4em] text-amber-300/80 font-medium">
                Selected Work
              </span>
            </div>
            
            <div className="absolute bottom-6 left-6 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-amber-300/70">
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(blocks.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
// ---------------------------------------------------------------------------
// Logo marquee / social proof strip
// ---------------------------------------------------------------------------
function LogoStrip() {
  const logos = ["Vercel", "Linear", "Figma", "Stripe", "Notion", "Framer"];
  return (
    <section className="border-y border-amber-400/10 bg-black py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6">
        {logos.map((l) => (
          <span
            key={l}
            className="text-sm font-medium tracking-tight text-neutral-600 transition-colors duration-300 hover:text-amber-300"
          >
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA band
// ---------------------------------------------------------------------------
function CTASection() {
  const [ref, visible] = useReveal(0.3);
  return (
    <section className="relative overflow-hidden bg-black px-6 py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-500/15 via-yellow-600/10 to-transparent blur-[100px]" />
      <div
        ref={ref}
        className={`relative mx-auto flex max-w-3xl flex-col items-center text-center transition-all duration-700 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Let's build something
          <br />
          unforgettable.
        </h2>
        <p className="mt-6 max-w-md text-neutral-400">
          From concept to launch — we partner with ambitious brands ready to
          stand out.
        </p>
        <a
          href="#"
          className="group mt-10 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-7 py-4 text-sm font-medium text-black shadow-[0_0_50px_-10px_rgba(245,180,60,0.6)] transition-all duration-300 hover:scale-[1.04] active:scale-95"
          data-cursor-hover
        >
          Get in touch
          <ArrowUpRight
            size={15}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Massive footer
// ---------------------------------------------------------------------------
function Footer() {
  const cols = [
    {
      title: "Studio",
      links: ["About", "Work", "Careers", "Journal"],
    },
    {
      title: "Services",
      links: ["Web Design", "Branding", "Motion", "Development"],
    },
    {
      title: "Connect",
      links: ["Twitter", "Instagram", "LinkedIn", "Dribbble"],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-amber-400/10 bg-black pt-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-10 pb-16 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-sm font-semibold tracking-tight text-white">
              STUDIO
            </span>
            <p className="mt-3 text-sm text-neutral-500">
              Crafting digital experiences at the highest level.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/60">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-neutral-400 transition-colors duration-300 hover:text-amber-300"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-amber-400/10 py-6 text-xs text-neutral-600 sm:flex-row">
          <span>© 2026 Studio. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-amber-300">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-amber-300">
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* Massive edge-to-edge typography */}
      <div className="pointer-events-none select-none overflow-hidden">
        <span
          className="block text-center font-bold leading-none"
          style={{
            fontSize: "clamp(5rem, 22vw, 16rem)",
            letterSpacing: "-0.04em",
            transform: "translateY(12%)",
            background: "linear-gradient(180deg, rgba(252,211,77,0.12), rgba(252,211,77,0.02))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          STUDIO
        </span>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Ambient cursor glow — soft light that follows the cursor across the page
// ---------------------------------------------------------------------------
function CursorGlow() {
  const glowRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const eased = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia && !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!active) setActive(true);
    };
    const onLeave = () => setActive(false);

    let raf;
    const animate = () => {
      eased.current.x += (pos.current.x - eased.current.x) * 0.15;
      eased.current.y += (pos.current.y - eased.current.y) * 0.15;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${eased.current.x}px, ${eased.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [active]);

  if (typeof window !== "undefined" && window.matchMedia && !window.matchMedia("(pointer: fine)").matches) {
    return null;
  }

  // ~4cm radius ≈ 151px at standard 96dpi -> ~300px diameter glow, softly falling off
  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed left-0 top-0 z-[1] rounded-full transition-opacity duration-500"
      style={{
        width: 300,
        height: 300,
        opacity: active ? 1 : 0,
        background:
          "radial-gradient(circle, rgba(255,200,87,0.22) 0%, rgba(255,170,40,0.1) 35%, rgba(255,170,40,0) 70%)",
        filter: "blur(2px)",
        willChange: "transform",
        mixBlendMode: "screen",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <div className="relative min-h-screen w-full bg-black font-sans antialiased selection:bg-white selection:text-black [&_*]:cursor-none">
      <CursorGlow />
      <CustomCursor />
      <Navbar />
      <Hero />
      <LogoStrip />
      <BentoSection />
      <div id="work">
        <ScrollExperience />
      </div>
      <CTASection />
      <Footer />
    </div>
  );
}
