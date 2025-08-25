// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import SetupPage from "./pages/SetupPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyPage from "./pages/MyPage.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SetupPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}



