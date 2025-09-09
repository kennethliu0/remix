import { Music } from "lucide-react";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="card">
      <h1 className="main-title">Remix</h1>
      <p className="subtitle">
        Change up the order of your playlists for a smoother listening
        experience
      </p>
      <div className="features">
        <h2 className="features-title">What this app does:</h2>
        <ul className="features-list">
          <li>Access your Spotify playlists securely</li>
          <li>Reorder tracks by audio features</li>
          <li>Preview changes before applying them</li>
          <li>Create new, reordered playlists in Spotify</li>
        </ul>
      </div>
      <Link
        className="login-btn"
        to="/playlists">
        <Music
          size={20}
          style={{ color: "#111", marginRight: "8px" }}
        />
        Login with Spotify
      </Link>
      <p className="disclaimer">
        By logging in, you agree to share your playlist data with this
        application. No playlist data will be saved beyond your current session.
      </p>
    </div>
  );
}

export default HomePage;
