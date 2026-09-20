/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  generateParticles3D,
  generateCoreParticles3D,
} from "./CORE/ReactorMath";
import ReactorCoreLens from "./CORE/ReactorCoreLens";

export default function LiquidAuraReactor({
  state = "idle",
  isCritical = false,
  activeMode = "talk",
  hasMessages = false,
}) {
  const canvasBackRef = useRef(null);
  const canvasFrontRef = useRef(null);
  const [particles] = useState(() => [
    ...generateParticles3D(140),
    ...generateCoreParticles3D(180, 45), // 180 particles condensed for the 3D core sphere
  ]);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 }); // Mouse coordinate tracker

  // Dynamic theme colors resolver
  const getColors = () => {
    if (isCritical) {
      return {
        coreGradStart: "rgba(255, 51, 51, 0.25)",
        coreGradEnd: "rgba(100, 0, 0, 0.05)",
        coreBorder: "rgba(255, 51, 51, 0.2)",
        glowColor: "rgba(255, 51, 51, 0.4)",
        particleColor: (opacity) => `rgba(255, 80, 80, ${opacity})`,
        particleGlow: (opacity) => `rgba(255, 51, 51, ${opacity * 0.3})`,
        ringColor: (opacity) => `rgba(255, 51, 51, ${opacity * 0.2})`,
        scale: 1.15,
        centerGlow: "rgba(255, 51, 51, 0.2)",
      };
    }

    switch (state) {
      case "listening": // React listening = Python PROCESSING
        return {
          coreGradStart: "rgba(255, 255, 255, 0.2)",
          coreGradEnd: "rgba(255, 255, 255, 0.02)",
          coreBorder: "rgba(255, 255, 255, 0.25)",
          glowColor: "rgba(255, 255, 255, 0.5)",
          particleColor: (opacity) => `rgba(255, 255, 255, ${opacity * 0.95})`,
          particleGlow: (opacity) => `rgba(255, 255, 255, ${opacity * 0.45})`,
          ringColor: (opacity) => `rgba(255, 255, 255, ${opacity * 0.25})`,
          scale: 1.1,
          centerGlow: "rgba(255, 255, 255, 0.15)",
        };
      case "processing":
        return {
          coreGradStart: "rgba(139, 92, 246, 0.2)",
          coreGradEnd: "rgba(30, 27, 75, 0.02)",
          coreBorder: "rgba(167, 139, 250, 0.15)",
          glowColor: "rgba(139, 92, 246, 0.4)",
          particleColor: (opacity) => `rgba(180, 140, 255, ${opacity * 0.9})`,
          particleGlow: (opacity) => `rgba(139, 92, 246, ${opacity * 0.35})`,
          ringColor: (opacity) => `rgba(139, 92, 246, ${opacity * 0.25})`,
          scale: 1.05,
          centerGlow: "rgba(139, 92, 246, 0.15)",
        };
      case "speaking":
        return {
          coreGradStart: "rgba(0, 240, 255, 0.22)",
          coreGradEnd: "rgba(0, 50, 255, 0.02)",
          coreBorder: "rgba(0, 240, 255, 0.25)",
          glowColor: "rgba(0, 240, 255, 0.55)",
          particleColor: (opacity) => `rgba(0, 240, 255, ${opacity * 0.95})`,
          particleGlow: (opacity) => `rgba(0, 180, 255, ${opacity * 0.4})`,
          ringColor: (opacity) => `rgba(0, 240, 255, ${opacity * 0.3})`,
          scale: 1.2,
          centerGlow: "rgba(0, 240, 255, 0.25)",
        };
      case "idle":
      default:
        return {
          coreGradStart: "rgba(0, 188, 255, 0.12)",
          coreGradEnd: "rgba(0, 50, 150, 0.01)",
          coreBorder: "rgba(0, 188, 255, 0.15)",
          glowColor: "rgba(0, 188, 255, 0.3)",
          particleColor: (opacity) => `rgba(0, 188, 255, ${opacity * 0.7})`,
          particleGlow: (opacity) => `rgba(0, 150, 255, ${opacity * 0.25})`,
          ringColor: (opacity) => `rgba(0, 188, 255, ${opacity * 0.15})`,
          scale: 1.0,
          centerGlow: "rgba(0, 188, 255, 0.1)",
        };
    }
  };

  const colors = getColors();

  // Mouse moves coordinates mapping for canvas relative areas
  const handleMouseMove = (e) => {
    const canvas = canvasFrontRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
  };

  // High-fidelity 3D rendering loops inside canvas sandwiches
  useEffect(() => {
    const canvasBack = canvasBackRef.current;
    const canvasFront = canvasFrontRef.current;
    if (!canvasBack || !canvasFront) return;

    const ctxBack = canvasBack.getContext("2d");
    const ctxFront = canvasFront.getContext("2d");
    let animationFrameId;

    const focalLength = 280; // Cam focal length
    const tiltX = 0.35; // Inclination on X axis for 3D perspective

    // Draws interconnected lines
    const drawConnections = (ctx, particlesArray) => {
      ctx.lineWidth = 0.45;
      for (let i = 0; i < particlesArray.length; i++) {
        const p1 = particlesArray[i];
        if (p1.isCore) continue;

        for (let j = i + 1; j < Math.min(i + 20, particlesArray.length); j++) {
          const p2 = particlesArray[j];
          if (p2.isCore) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dx2 = p1.z - p2.z;
          const distSq = dx * dx + dy * dy + dx2 * dx2 * 0.1;

          if (distSq < 1200) {
            const dist = Math.sqrt(distSq);
            const minOpacity =
              Math.min(p1.opacity, p2.opacity) * Math.min(p1.scale, p2.scale);
            const lineOpacity = (1 - dist / 34) * 0.2 * minOpacity;

            if (lineOpacity > 0) {
              ctx.strokeStyle = colors.particleColor(lineOpacity);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }
    };

    // Draws external dynamic ring lines
    const drawHolographicRing = (
      ctx,
      centerX,
      centerY,
      radius,
      numPoints,
      strokeStyle,
      distortionIntensity,
      dashed = false,
    ) => {
      ctx.beginPath();
      ctx.lineWidth = dashed ? 0.5 : 0.8;
      ctx.strokeStyle = strokeStyle;
      if (dashed) {
        ctx.setLineDash([2, 5]);
      } else {
        ctx.setLineDash([]);
      }

      const t = timeRef.current;

      for (let i = 0; i <= numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;

        let r = radius;
        if (state === "speaking") {
          r += Math.sin(angle * 6 + t * 0.12) * distortionIntensity;
          r += Math.cos(angle * 3 - t * 0.08) * (distortionIntensity * 0.4);
        } else if (state === "listening") {
          r += Math.sin(angle * 12 + t * 0.3) * 2;
        } else if (state === "idle") {
          r += Math.sin(angle * 4 + t * 0.02) * 1.5;
        }

        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const render = () => {
      if (activeMode === "chat" && hasMessages) {
        return; // Freeze when chat has messages — orb is hidden anyway, save CPU/GPU
      }

      timeRef.current += 1;
      const t = timeRef.current;
      const width = canvasBack.width;
      const height = canvasBack.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctxBack.clearRect(0, 0, width, height);
      ctxFront.clearRect(0, 0, width, height);

      // Render rings on Back canvas to keep them properly blurred
      drawHolographicRing(
        ctxBack,
        centerX,
        centerY,
        75,
        80,
        colors.ringColor(state === "speaking" ? 0.8 : 0.4),
        state === "speaking" ? 14 : 4,
        false,
      );

      drawHolographicRing(
        ctxBack,
        centerX,
        centerY,
        120,
        60,
        colors.ringColor(0.25),
        state === "speaking" ? 8 : 2,
        true,
      );

      const projectedParticles = [];

      // Project particles in 3D space
      particles.forEach((p) => {
        let speedMultiplier = 0;
        if (state === "speaking") speedMultiplier = 1.2;
        else if (state === "idle") speedMultiplier = 0;
        else if (state === "listening") speedMultiplier = 0.1;

        p.currentAngle += p.orbitSpeed * speedMultiplier;
        const angleY = p.currentAngle;

        let rScale = 1.0;
        let opacity = 0.4 + Math.sin(t * 0.05 + p.phase) * 0.25;

        if (state === "speaking") {
          const soundWave =
            Math.sin(t * 0.18 + p.phase) * 0.3 * p.reactiveFactor;
          rScale += soundWave;
          opacity = 0.7 + Math.sin(t * 0.1 + p.phase) * 0.3;
        } else if (state === "listening") {
          const globalPulse = Math.sin(t * 0.08);
          rScale = 1.0 + globalPulse * 0.03;
          opacity = 0.5 + globalPulse * 0.2;
        } else if (state === "idle") {
          if (!p.isCore) {
            rScale = 1.0 + Math.sin(t * 0.02 + p.phase) * 0.04;
          } else {
            opacity = 0.6;
          }
        }

        const x3d = p.x3d * rScale;
        const y3d = p.y3d * rScale;
        const z3d = p.z3d * rScale;

        const x1 = x3d * Math.cos(angleY) - z3d * Math.sin(angleY);
        const z1 = x3d * Math.sin(angleY) + z3d * Math.cos(angleY);

        const y2 = y3d * Math.cos(tiltX) - z1 * Math.sin(tiltX);
        const z2 = y3d * Math.sin(tiltX) + z1 * Math.cos(tiltX);

        const scale = focalLength / (focalLength + z2);
        let projectedX = centerX + x1 * scale;
        let projectedY = centerY + y2 * scale;

        // Repulsion physics via cursor coordinates
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        
        let dx = 0;
        let dy = 0;
        let dist = 1000;
        
        if (mx > -900) { // Only calculate math bounds if mouse is inside canvas!
          dx = projectedX - mx;
          dy = projectedY - my;
          dist = Math.sqrt(dx * dx + dy * dy);
        }

        if (dist < 80) {
          const force = (80 - dist) / 80;
          projectedX += (dx / dist) * force * 35 * p.reactiveFactor;
          projectedY += (dy / dist) * force * 35 * p.reactiveFactor;
          opacity = 0.95;
        }

        projectedParticles.push({
          x: projectedX,
          y: projectedY,
          z: z2, // Store real depth for Z-Sort sorting
          size: p.size * scale,
          opacity: opacity,
          scale: scale,
        });
      });

      // Z-Sort: sort from back to front
      projectedParticles.sort((a, b) => b.z - a.z);

      const backParticles = projectedParticles.filter((p) => p.z > 0);
      const frontParticles = projectedParticles.filter((p) => p.z <= 0);

      // Background renders (behind core)
      drawConnections(ctxBack, backParticles);
      backParticles.forEach((cp) => {
        const fogOpacity = cp.opacity * 0.6;

        ctxBack.beginPath();
        ctxBack.arc(cp.x, cp.y, cp.size * 2.8, 0, 2 * Math.PI);
        ctxBack.fillStyle = colors.particleGlow(fogOpacity);
        ctxBack.fill();

        ctxBack.beginPath();
        ctxBack.arc(cp.x, cp.y, cp.size, 0, 2 * Math.PI);
        ctxBack.fillStyle = colors.particleColor(fogOpacity);
        ctxBack.fill();
      });

      // Foreground renders (in front of core)
      drawConnections(ctxFront, frontParticles);
      frontParticles.forEach((cp) => {
        ctxFront.beginPath();
        ctxFront.arc(cp.x, cp.y, cp.size * 2.8, 0, 2 * Math.PI);
        ctxFront.fillStyle = colors.particleGlow(cp.opacity);
        ctxFront.fill();

        ctxFront.beginPath();
        ctxFront.arc(cp.x, cp.y, cp.size, 0, 2 * Math.PI);
        ctxFront.fillStyle = colors.particleColor(cp.opacity);
        ctxFront.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [state, colors, particles, activeMode, hasMessages]);

  return (
    <div
      className="relative flex items-center justify-center w-[500px] h-[500px] select-none cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. DIFFUSE GLOW LAYER */}
      <motion.div
        animate={{ scale: colors.scale }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        style={{
          width: 320,
          height: 320,
          borderRadius: "50%",
          filter: "blur(60px)",
          background: `radial-gradient(circle, ${colors.centerGlow} 0%, transparent 70%)`,
        }}
        className="absolute z-0 pointer-events-none transition-all duration-700"
      />

      {/* 2. CANVAS BACK (Spherical background sorting) */}
      <motion.canvas
        ref={canvasBackRef}
        width={400}
        height={400}
        animate={{ scale: colors.scale }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        className="absolute z-10 w-[400px] h-[400px] pointer-events-none mix-blend-screen"
      />

      {/* 3. VOLUMETRIC GLASS LENS CORE */}
      <ReactorCoreLens colors={colors} />

      {/* 4. CANVAS FRONT (Spherical foreground sorting) */}
      <motion.canvas
        ref={canvasFrontRef}
        width={400}
        height={400}
        animate={{ scale: colors.scale }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        className="absolute z-30 w-[400px] h-[400px] pointer-events-none mix-blend-screen"
      />

      {/* 5. ORGANIC DASHED OUTER AURA SQUIRCLE */}
      <motion.div
        animate={{
          rotate: state === "processing" ? 360 : -360,
          scale: colors.scale * 1.01,
        }}
        transition={{
          rotate: {
            repeat: Infinity,
            duration: state === "processing" ? 7 : 25,
            ease: "linear",
          },
          scale: { type: "spring", stiffness: 140, damping: 16 },
        }}
        style={{
          width: 320,
          height: 320,
          border: "1px dashed rgba(255, 255, 255, 0.05)",
          borderRadius: "38%",
          position: "absolute",
          zIndex: 40,
        }}
        className="pointer-events-none transition-colors duration-500"
      />
    </div>
  );
}
