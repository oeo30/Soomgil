import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function CustomLoadingPage() {
  const location = useLocation();
  const nav = useNavigate();

  // 업로드 로직 (그대로)
  useEffect(() => {
    if (!location.state?.drawingBlob) return;

    const formData = new FormData();
    formData.append("file", location.state.drawingBlob, "drawing.png");

    fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        nav("/custom-result", { state: { result: data.result } });
      })
      .catch((err) => {
        console.error(err);
        // alert("경로 생성에 실패했습니다.");
        // nav("/custom-walk");
      });
  }, [location.state, nav]);

  // 렌더링할 이미지들
  const SPRITES = useMemo(
    () => [
      { src: "/illust/bear.png", alt: "bear" },
      { src: "/illust/jellyfish.png", alt: "jellyfish" },
      { src: "/illust/cat2.png", alt: "cat" },
      { src: "/illust/cloud.png", alt: "cloud" },
      { src: "/illust/gingerman.png", alt: "gingerman" },
      { src: "/illust/heart2.png", alt: "heart2" },
      { src: "/illust/snowman.png", alt: "snowman" },
    ],
    []
  );

  // ----- 파라미터 조정점 -----
  const SPRITE_SIZE = 100;    // 각 이미지 너비(px)
  const MAX_SPEED = 80;       // px/s
  const JITTER = 25;          // px/s^2 (작은 난수 가속)
  const TURN_INTERVAL = [1.5, 3.5]; // 초 (큰 방향 전환 주기)
  const TURN_FORCE = 60;      // px/s^2 (큰 방향 전환 가속)
  // ---------------------------

  const containerRef = useRef(null);

  // 렌더용 위치(state) + 실제 물리 위치(ref)
  const [pos, setPos] = useState(() => SPRITES.map(() => ({ x: 0, y: 0 })));
  const posRef = useRef(SPRITES.map(() => ({ x: 0, y: 0 })));
  const velRef = useRef(
    SPRITES.map(() => {
      const speed = 20 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      return { vx: Math.cos(theta) * speed, vy: Math.sin(theta) * speed };
    })
  );
  const nextTurnAtRef = useRef(
    SPRITES.map(
      () =>
        performance.now() +
        (TURN_INTERVAL[0] +
          Math.random() * (TURN_INTERVAL[1] - TURN_INTERVAL[0])) *
          1000
    )
  );

  // 컨테이너 크기 측정 & 초기 위치 랜덤 배치
  const measureAndSeed = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const margin = 20;

    const seeded = SPRITES.map(() => ({
      x: margin + Math.random() * Math.max(1, W - SPRITE_SIZE - margin * 2),
      y: margin + Math.random() * Math.max(1, H - SPRITE_SIZE - margin * 2),
    }));

    posRef.current = seeded;
    setPos(seeded); // 초기 렌더 트리거
  };

  useEffect(() => {
    measureAndSeed();
    // 윈도우 리사이즈 시 다시 시드(너무 튀면 원하지 않으면 제거)
    const onResize = () => measureAndSeed();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SPRITES.length]);

  // 랜덤워킹 애니메이션 (ref 기반)
  useEffect(() => {
    let rafId;
    let last = performance.now();

    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const el = containerRef.current;
      if (!el) {
        rafId = requestAnimationFrame(step);
        return;
      }
      const rect = el.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      const p = posRef.current.map((v) => ({ ...v }));
      const v = velRef.current.map((w) => ({ ...w }));

      for (let i = 0; i < SPRITES.length; i++) {
        // 작은 난수 가속
        v[i].vx += (Math.random() * 2 - 1) * JITTER * dt;
        v[i].vy += (Math.random() * 2 - 1) * JITTER * dt;

        // 주기적 큰 방향 전환
        if (now >= nextTurnAtRef.current[i]) {
          const theta = Math.random() * Math.PI * 2;
          v[i].vx += Math.cos(theta) * TURN_FORCE;
          v[i].vy += Math.sin(theta) * TURN_FORCE;

          const gap =
            (TURN_INTERVAL[0] +
              Math.random() * (TURN_INTERVAL[1] - TURN_INTERVAL[0])) *
            1000;
          nextTurnAtRef.current[i] = now + gap;
        }

        // 속도 상한
        const sp = Math.hypot(v[i].vx, v[i].vy);
        if (sp > MAX_SPEED) {
          const s = MAX_SPEED / Math.max(1e-6, sp);
          v[i].vx *= s;
          v[i].vy *= s;
        }

        // 위치 업데이트
        let nx = p[i].x + v[i].vx * dt;
        let ny = p[i].y + v[i].vy * dt;

        // 경계 반사
        if (nx < 0) {
          nx = 0;
          v[i].vx = Math.abs(v[i].vx);
        } else if (nx > W - SPRITE_SIZE) {
          nx = W - SPRITE_SIZE;
          v[i].vx = -Math.abs(v[i].vx);
        }
        if (ny < 0) {
          ny = 0;
          v[i].vy = Math.abs(v[i].vy);
        } else if (ny > H - SPRITE_SIZE) {
          ny = H - SPRITE_SIZE;
          v[i].vy = -Math.abs(v[i].vy);
        }

        p[i] = { x: nx, y: ny };
      }

      // ref 갱신 → 렌더 트리거
      posRef.current = p;
      velRef.current = v;
      setPos(p);

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
    // 의도적으로 deps 비움 (루프 내부에서 ref 사용)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SPRITES.length]);

  // 인라인 스타일
  const styles = {
    container: {
      textAlign: "center",
      padding: 20,
      height: "100vh",
      background: "#f9f9f9",
      fontFamily: "MyCustomFont, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      overflow: "hidden",
      position: "relative", // 절대좌표 기준
      boxSizing: "border-box",
    },
    textWrapper: {
    position: "relative",
    zIndex: 10,              // 텍스트는 위 레이어
    display: "flex",
    flexDirection: "column",
    alignItems: "center",    // 좌우 가운데
    justifyContent: "center",// 위아래 가운데
    height: "100%",          // 컨테이너 전체 높이에서 중앙 정렬
  },
    title: {
      marginTop: 50,
      fontSize: 40,
      marginBottom: 0,
      color: "#e69b38ff",
      textShadow: "0.7px 0 #e69b38ff, -0.7px 0 #e69b38ff, 0 0.7px #e69b38ff, 0 -0.7px #e69b38ffk",
    },
    subtitle: {
      fontSize: 25,
      marginTop: -5,
      marginBottom: 40,
      color: "#e69b38ff",
      textShadow: "0.3x 0 #e69b38ff, -0.3px 0 #e69b38ff, 0 0.3px #e69b38ff, 0 -0.3px #e69b38ffk",
    },
    sprite: {
      position: "absolute",
      top: 0,
      left: 0,
      userSelect: "none",
      pointerEvents: "none",
      willChange: "transform",
      width: `${SPRITE_SIZE}px`,
    },
  };

  return (
    <div ref={containerRef} style={styles.container}>
    <div style={styles.textWrapper}>
      <h1 style={styles.title}>나만의 산책로 생성중</h1>
      <h3 style={styles.subtitle}>다른 사람들이 그린 그림이 떠다니고 있어요!</h3>
      </div>

      {SPRITES.map((s, idx) => (
        <img
          key={idx}
          src={s.src}
          alt={s.alt}
          draggable={false}
          style={{
            ...styles.sprite,
            transform: `translate(${pos[idx]?.x || 0}px, ${pos[idx]?.y || 0}px)`,
          }}
        />
      ))}
    </div>
  );
}
