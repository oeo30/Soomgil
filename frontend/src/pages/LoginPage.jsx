// src/pages/LoginPage.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === "test@gmail.com" && password === "1234") {
      login();
      nav("/");
    } else {
      alert("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* 구글 로고 */}
        <img src="/assets/google.png" alt="Google" style={styles.logo} />
        <h2 style={styles.title}>로그인</h2>
        <p style={styles.subtitle}>Google 계정 사용</p>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="이메일 또는 휴대전화"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.btn}>로그인</button>
        </form>

        {/* 보조 링크 */}
        <div style={styles.links}>
          <a href="#">이메일 찾기</a>
          <a href="#">계정 만들기</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f2f2f2",
  },
  card: {
    background: "#fff",
    padding: "40px 30px",
    borderRadius: 8,
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    width: 350,
    textAlign: "center",
  },
  logo: {
    width: 75,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    margin: "8px 0 20px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  input: {
    padding: "12px 14px",
    borderRadius: 4,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  btn: {
    marginTop: 10,
    padding: "12px",
    borderRadius: 4,
    border: "none",
    background: "#4285F4",
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    cursor: "pointer",
  },
  links: {
    marginTop: 20,
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
  },
};

