import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    console.log("hit auth");
    if (code) {
      navigate("/playlists");
    } else {
      navigate("/");
    }
  }, [navigate]);
  return <div>Processing authentication...</div>;
}
