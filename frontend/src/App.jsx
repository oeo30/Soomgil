// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import SetupPage from "./pages/SetupPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyPage from "./pages/MyPage.jsx";
import CustomWalkPage from "./pages/CustomWalkPage";
import CustomLoadingPage from "./pages/CustomLoadingPage";
import CustomResultPage from "./pages/CustomResultPage";



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SetupPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/custom-walk" element={<CustomWalkPage />} />
      <Route path="/custom-loading" element={<CustomLoadingPage />} />
      <Route path="/custom-result" element={<CustomResultPage />} />
      </Routes>
  );
}



