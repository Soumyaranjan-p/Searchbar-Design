"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; alpha: number; life: number; decay: number; hue: number;
}
interface Ripple {
  x: number; y: number; r: number; maxR: number; alpha: number;
}
export default function GooeySearchBar() {
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const pCanvasRef = useRef<HTMLCanvasElement>(null);
  const rCanvasRef = useRef<HTMLCanvasElement>(null);
  const glowOrbRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const mouseRef = useRef({ x: 160, y: 28 });
  const glowRef = useRef({ x: 160, y: 28 });
  const pillRef = useRef<HTMLDivElement>(null);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const spawnBurstParticles = useCallback(() => {
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        particlesRef.current.push({
          x: 28 + Math.random() * 40,
          y: 28 + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2,
          r: 2 + Math.random() * 4,
          alpha: 0.7 + Math.random() * 0.3,
          life: 1,
          decay: 0.018 + Math.random() * 0.012,
          hue: 260 + Math.random() * 40,
        });
      }, i * 25);
    }
  }, []);

  const spawnTypingParticles = useCallback((x: number) => {
    if (Math.random() > 0.5) return;
    particlesRef.current.push({
      x: x + (Math.random() - 0.5) * 12,
      y: 28 + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -0.8 - Math.random() * 1.5,
      r: 1 + Math.random() * 2.5,
      alpha: 0.8,
      life: 1,
      decay: 0.03 + Math.random() * 0.02,
      hue: 260 + Math.random() * 50,
    });
  }, []);

  const addRipple = useCallback((x: number) => {
    ripplesRef.current.push({
      x, y: 28, r: 0,
      maxR: 20 + Math.random() * 12,
      alpha: 0.5,
    });
  }, []);

  const getCursorX = useCallback(() => {
    if (!inputRef.current) return 56;
    const text = inputRef.current.value.slice(0, inputRef.current.selectionStart ?? inputRef.current.value.length);
    const tmp = document.createElement("span");
    tmp.style.cssText = "position:absolute;visibility:hidden;font-size:15px;font-family:inherit;white-space:pre;letter-spacing:0.01em;";
    tmp.textContent = text;
    document.body.appendChild(tmp);
    const w = tmp.offsetWidth;
    document.body.removeChild(tmp);
    return 56 + w + 8;
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
    for (const p of particlesRef.current) {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.04;
      p.life -= p.decay;
      p.alpha = p.life * 0.85;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 72%, ${p.alpha})`;
      ctx.shadowColor = `hsla(${p.hue}, 80%, 72%, 0.5)`;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  const drawRipples = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ripplesRef.current = ripplesRef.current.filter((r) => r.alpha > 0.02);
    for (const r of ripplesRef.current) {
      r.r += 1.4;
      r.alpha *= 0.88;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(270, 75%, 70%, ${r.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (animFrameRef.current) return;
    const pCanvas = pCanvasRef.current;
    const rCanvas = rCanvasRef.current;
    if (!pCanvas || !rCanvas) return;
    const pCtx = pCanvas.getContext("2d")!;
    const rCtx = rCanvas.getContext("2d")!;

    const loop = () => {
      drawParticles(pCtx, pCanvas.width, pCanvas.height);
      drawRipples(rCtx, rCanvas.width, rCanvas.height);

      
      glowRef.current.x = lerp(glowRef.current.x, mouseRef.current.x, 0.08);
      glowRef.current.y = lerp(glowRef.current.y, mouseRef.current.y, 0.08);
      if (glowOrbRef.current) {
        glowOrbRef.current.style.left = `${glowRef.current.x}px`;
        glowOrbRef.current.style.top = `${glowRef.current.y}px`;
      }

      if (
        particlesRef.current.length > 0 ||
        ripplesRef.current.length > 0 ||
        expanded
      ) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        animFrameRef.current = null;
      }
    };
    loop();
  }, [drawParticles, drawRipples, expanded]);

  const expandSearch = useCallback(() => {
    setExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
      spawnBurstParticles();
    }, 280);
  }, [spawnBurstParticles]);

  const collapseSearch = useCallback(() => {
    setExpanded(false);
    setInputValue("");
    particlesRef.current = [];
    ripplesRef.current = [];
  }, []);

  useEffect(() => {
    if (expanded) startAnimation();
  }, [expanded, startAnimation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expanded) collapseSearch();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [expanded, collapseSearch]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = pillRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const caret = getCursorX();
    spawnTypingParticles(caret);
    addRipple(caret);
    startAnimation();
  };

  const pillWidth = expanded ? "320px" : "56px";
  const pillShadow = expanded
    ? "0 0 32px 4px rgba(120,80,255,0.18), 0 0 0 1px rgba(120,80,255,0.35)"
    : "0 0 0 0 rgba(120,80,255,0)";
  const pillBorder = expanded
    ? "1px solid rgba(120,80,255,0.5)"
    : "1px solid rgba(120,80,255,0.25)";

  return (
    <>
      {/* SVG Gooey Filter */}
      <svg
        style={{ position: "absolute", width: 0, height: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="gooey" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "320px",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ filter: "url(#gooey)", position: "relative" }}>
          
            {[
              { w: 60, h: 60, top: -30, left: 60 },
              { w: 44, h: 44, top: -20, right: 40 },
              { w: 30, h: 30, bottom: -15, left: 80 },
            ].map((blob, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  borderRadius: "50%",
                  background: "rgba(10,10,18,0.92)",
                  width: blob.w, height: blob.h,
                  top: blob.top, left: (blob as any).left, right: (blob as any).right, bottom: (blob as any).bottom,
                  opacity: expanded ? 0 : 0,
                  transform: "scale(0)",
                  transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                  pointerEvents: "none",
                }}
              />
            ))}
            <div
              ref={pillRef}
              onMouseMove={handleMouseMove}
              onClick={!expanded ? expandSearch : undefined}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                background: "black",
                borderRadius: "999px",
                overflow: "hidden",
                width: pillWidth,
                height: "56px",
                cursor: expanded ? "default" : "pointer",
                border: pillBorder,
                boxShadow: pillShadow,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                transition:
                  "width 0.55s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease",
              }}
            >
              {/* Glow  */}
              <div
                ref={glowOrbRef}
                style={{
                  position: "absolute",
                  width: 90, height: 90,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
                  pointerEvents: "none",
                  zIndex: 0,
                  opacity: expanded ? 1 : 0,
                  transform: "translate(-50%, -50%)",
                  transition: "opacity 0.3s",
                  top: "50%", left: "50%",
                }}
              />

              {/* Particlee*/}
              <canvas
                ref={pCanvasRef}
                width={320} height={56}
                style={{
                  position: "absolute", top: 0, left: 0,
                  pointerEvents: "none", zIndex: 0, borderRadius: "999px",
                }}
              />

              {/* canvas */}
              <canvas
                ref={rCanvasRef}
                width={320} height={56}
                style={{
                  position: "absolute", top: 0, left: 0,
                  pointerEvents: "none", zIndex: 1,
                }}
              />

              {/* Search iconn */}
              <div
                onClick={expandSearch}
                style={{
                  flexShrink: 0,
                  width: 56, height: 56,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", zIndex: 2,
                  transform: expanded ? "scale(0.85)" : "scale(1)",
                  transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: 22, height: 22, stroke: expanded ? "#c4b5fd" : "#a78bfa", strokeWidth: 2.2, fill: "none", transition: "stroke 0.3s" }}
                >
                  <circle cx="11" cy="11" r="7.5" />
                  <line x1="18" y1="18" x2="21.5" y2="21.5" />
                </svg>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center",
                  overflow: "hidden",
                  opacity: expanded ? 1 : 0,
                  paddingRight: expanded ? 16 : 0,
                  transition: "opacity 0.35s ease 0.15s",
                }}
              >
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInput}
                  onBlur={() => {
                    setTimeout(() => { if (!inputValue) collapseSearch(); }, 180);
                  }}
                  placeholder="search anything..."
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    color: "#e9d5ff", fontSize: 15, fontWeight: 400,
                    width: "100%", caretColor: "#a78bfa",
                    fontFamily: "inherit", letterSpacing: "0.01em",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        
        <p
          style={{
            marginTop: 24, textAlign: "center",
            fontSize: 13, color: "rgba(167,139,250,0.45)",
            letterSpacing: "0.04em",
            opacity: expanded ? 0 : 1,
            transition: "opacity 0.4s",
          }}
        >
        Search Anything
        </p>
      </div>
    </>
  );
}