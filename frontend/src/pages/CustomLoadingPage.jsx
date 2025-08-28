import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function CustomLoadingPage() {
  const location = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    if (!location.state?.drawingBlob) return;

    const formData = new FormData();
    formData.append("file", location.state.drawingBlob, "drawing.png");

    // 서버 업로드 + 경로 생성
    fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        // ✅ 경로 생성이 끝나면 CustomResultPage로 이동
        nav("/custom-result", { state: { result: data.result } });
      })
      .catch((err) => {
        console.error(err);
        alert("경로 생성에 실패했습니다.");
        nav("/custom-walk");
      });
  }, [location.state, nav]);

  return (
    <div style={{ textAlign: "center", padding: 20, height: "100vh", background: "#f9f9f9", fontFamily: "MyCustomFont" }}>
        <h1 style={{ fontSize: 28, marginBottom: 10 }}>나만의 산책로 생성중</h1>
        <h3 style={{ fontSize: 18, marginBottom: 20, color: "#555" }}>다른 사람들이 그린 그림이에요!</h3>

      <div style={styles.gallery}>
        {/* ✅ 예시: 다른 사람들이 그린 그림 */}
        <img src="/illust/bear.png" alt="sample1" style={styles.img} />
        <img src="/illust/jellyfish.png" alt="sample2" style={styles.img} />
        <img src="/illust/cat2.png" alt="sample3" style={styles.img} />
        <img src="/illust/cloud.png" alt="sample4" style={styles.img} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    textAlign: "center",
    padding: 20,
    height: "100vh",
    background: "#f9f9f9",
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: "#555",
  },
  gallery: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  img: {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: 8,
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
};
