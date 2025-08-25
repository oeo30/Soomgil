// src/pages/LoginPage.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const handleGoogleLogin = () => {
    // 실제 구글 인증 대신 바로 로그인 성공 처리
    login();
    nav("/"); // 홈으로 이동
  };

  return (
    <div style={styles.page}>
      <h1>Google 로그인</h1>
      <button style={styles.btn} onClick={handleGoogleLogin}>
        Google 로그인
      </button>
    </div>
  );
}

const styles = {
  page: { textAlign: "center", marginTop: 100 },
  btn: {
    marginTop: 20,
    padding: "12px 24px",
    borderRadius: 8,
    border: "none",
    background: "#4285F4",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
  },
};
