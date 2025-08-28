import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomWalkPage() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = 400;
    const height = 400;

    // 캔버스 크기를 CSS 크기와 동일하게 설정
    canvas.width = width;
    canvas.height = height;

    // CSS 고정 크기
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // 기본 스타일 설정
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
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

    // 마우스 좌표를 캔버스 좌표로 변환 (CSS 크기 기준)
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
      console.log("🎨 캔버스 Blob 생성:", blob.size, "bytes");
      nav("/custom-loading", { state: { drawingBlob: blob } });
    }, "image/png", 1.0);
  };

  return (
    <div style={{ textAlign: "center", padding: 20, boxSizing: "border-box",}}>
      {/* 제목 */}
      <h1
        style={{
          marginTop: 40,
          fontSize: 40,
          fontFamily: "MyCustomFont",
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
          color: "#555",
          fontFamily: "MyCustomFont",
          fontWeight: "500",
          textShadow:
            "0.3px 0 #555, -0.3px 0 #555, 0 0.3px #555, 0 -0.3px #555",
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
          boxSizing: "border-box",
          touchAction: "none" // 터치 스크롤 방지
        }}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onTouchStart={(e) => {
          e.preventDefault();
          startDrawing();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopDrawing();
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          draw(mouseEvent);
        }}
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

