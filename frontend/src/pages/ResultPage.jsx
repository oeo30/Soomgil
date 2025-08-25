import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";

export default function ResultPage() {
  const nav = useNavigate();
  const { canProceed } = useSelection();

  useEffect(() => {
    if (!canProceed) nav("/", { replace: true });
  }, [canProceed, nav]);

  return <div style={{padding:20}}>ResultPage skeleton</div>;
}

