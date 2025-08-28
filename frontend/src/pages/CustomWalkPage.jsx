import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomWalkPage() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const ratio = window.devicePixelRatio || 1;
    const width = 400;
    const height = 400;

    // 내부 해상도 고해상도로 맞춤
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    // CSS 고정 크기
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // 좌표계 스케일 보정
    ctx.scale(ratio, ratio);
  }, []);

  const startDrawing = () => setDrawing(true);
  const stopDrawing = () => {
    setDrawing(false);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
  };

  const draw = (e) => {
  if (!drawing) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();

  const ratio = window.devicePixelRatio || 1;

  // 좌표 보정 (배율 나눠주기)
  const x = (e.clientX - rect.left) / ratio;
  const y = (e.clientY - rect.top) / ratio;

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
};


  const handleNext = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      nav("/custom-loading", { state: { drawingBlob: blob } });
    });
  };

  return (
    <div style={{ textAlign: "center", padding: 20, boxSizing: "border-box",}}>
      {/* 제목 */}
      <h1
        style={{
          marginTop: 40,
          fontSize: 40,
          fontFamily: "MyCustomFont",
          fontWeight: "bold",
          textShadow:
            "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
        }}
      >
        나만의 산책로 만들기
      </h1>

      {/* 부제목 */}
      <h3
        style={{
          marginTop: -5,
          marginBottom: 20,
          fontSize: 20,
          fontFamily: "MyCustomFont",
          fontWeight: "500",
          textShadow:
            "0.3px 0 black, -0.3px 0 black, 0 0.3px black, 0 -0.3px black",
        }}
      >
        그림으로 만드는 나만의 산책로
      </h3>

      {/* 캔버스 */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{
          display: "block",
          width: "400px",
          margin: "0 auto",
          maxWidth: "100%",
          height: "400px",
          border: "2px solid black",
          borderRadius: "16px",
          boxSizing: "border-box"
        }}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
      />

      {/* 버튼 */}
      <button
        style={{
          marginTop: 20,
          padding: "8px 16px",
          width: 140,
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
          borderRadius: "999px",
          background: "#70c273",
          color: "#fff",
          fontSize: 18,
          fontFamily: "MyCustomFont",
          fontWeight: "bold",
          textShadow:
            "0.3px 0 white, -0.3px 0 white, 0 0.3px white, 0 -0.3px white",
          cursor: "pointer",
        }}
        onClick={handleNext}
      >
        다음으로 ➩
      </button>
    </div>
  );
}


