import { useEffect, useState } from "react";
import {
  Scopes,
  type Playlist,
  type PlaylistedTrack,
  type Track,
  type TrackItem,
  type UserProfile,
} from "@spotify/web-api-ts-sdk";
import { useSpotify } from "../hooks/useSpotify";
import { Link } from "react-router-dom";
import LoaderContainer from "../components/loader-container";

const ReorderPlaylists = () => {
  const spotify = useSpotify(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    import.meta.env.VITE_REDIRECT_TARGET,
    [...Scopes.playlistModify, ...Scopes.playlistRead]
  );

  const [playlists, setPlaylists] = useState<Playlist<TrackItem>[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<Playlist<TrackItem> | null>(null);
  const [savedPlaylist, setSavedPlaylist] = useState<string>("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [reorderedTracks, setReorderedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "select" | "reorder" | "listen"
  >("select");

  useEffect(() => {
    async function fetchPlaylists() {
      if (!spotify) return;
      setLoading(true);
      const spotifyProfile = await spotify.currentUser.profile();
      setProfile(spotifyProfile);

      const playlists = await spotify.playlists.getUsersPlaylists(
        spotifyProfile.id,
        50
      );
      setPlaylists(playlists.items.filter((pl) => pl.tracks.total <= 200));
      setLoading(false);
    }
    fetchPlaylists();
  }, [spotify]);

  async function handleSelectPlaylist(playlist: Playlist<TrackItem>) {
    if (!spotify) return;
    setSelectedPlaylist(playlist);
    setCurrentStep("reorder");
    setLoading(true);

    const promises = [
      spotify.playlists.getPlaylistItems(playlist.id),
      spotify.playlists.getPlaylistItems(
        playlist.id,
        undefined,
        undefined,
        undefined,
        100
      ),
    ];

    const results = await Promise.all(promises);
    for (const result of results) {
      if (result.total > 200) {
        alert("Please choose a playlist with 200 or fewer tracks.");
        setLoading(false);
        setSelectedPlaylist(null);
        return;
      }
      setTracks((prev) => [
        ...prev,
        ...result.items.map((tr: PlaylistedTrack<Track>) => tr.track),
      ]);
    }

    setLoading(false);
  }

  function reorderTracks() {
    setLoading(true);
    const worker = new Worker(
      new URL("../utils/tspWorker.ts?worker", import.meta.url),
      {
        type: "module",
      }
    );
    const map = new Map(tracks.map((t) => [t.id, t]));
    worker.postMessage(tracks.map((t) => t.id));
    worker.onmessage = (e: MessageEvent<string[]>) => {
      setReorderedTracks(e.data.map((id) => map.get(id)!));
      setLoading(false);
      worker.terminate();
    };
    return () => {
      worker.terminate();
      setLoading(false);
    };
  }

  async function updatePlaylistOrder() {
    if (!spotify || !profile) return;
    if (!selectedPlaylist || reorderedTracks.length === 0) return;
    setCurrentStep("listen");
    setLoading(true);
    const reorderedPlaylist = await spotify.playlists.createPlaylist(
      profile.id,
      {
        name: `${selectedPlaylist.name} (Reordered)`,
        description: `Reordered from ${selectedPlaylist.name} with Remix`,
      }
    );
    await spotify.playlists.addItemsToPlaylist(
      reorderedPlaylist.id,
      reorderedTracks.slice(0, 100).map((tr) => tr.uri)
    );
    if (reorderedTracks.length > 100) {
      await spotify.playlists.addItemsToPlaylist(
        reorderedPlaylist.id,
        reorderedTracks.slice(100, 200).map((tr) => tr.uri)
      );
    }
    setSavedPlaylist(reorderedPlaylist.id);
    setLoading(false);
  }
  const resetSelections = () => {
    setTracks([]);
    setReorderedTracks([]);
    setSelectedPlaylist(null);
    setSavedPlaylist("");
    setCurrentStep("select");
  };
  return (
    <div className="card">
      <Link
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 10,
        }}
        className="logout-btn"
        to="/"
        onClick={() => {
          spotify?.logOut();
        }}>
        Log out
      </Link>
      <h1 className="main-title">Remix</h1>
      {currentStep === "select" ? (
        <div className="card-content">
          <p>Please select a playlist with 200 tracks or fewer.</p>
          {loading ? (
            <LoaderContainer />
          ) : (
            <ul className="playlist-list">
              {" "}
              {playlists.map((pl) => (
                <li key={pl.id}>
                  <button onClick={() => handleSelectPlaylist(pl)}>
                    {pl.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : currentStep === "reorder" && selectedPlaylist ? (
        <div className="card-content">
          <h3>Tracks in {selectedPlaylist.name}</h3>
          <div className="button-container">
            <button onClick={resetSelections}>Back</button>
            <button onClick={reorderTracks}>Reorder</button>
          </div>
          {loading ? (
            <LoaderContainer />
          ) : (
            <ol className="song-list">
              {(reorderedTracks.length > 0 ? reorderedTracks : tracks).map(
                (tr) => (
                  <li key={tr.id}>
                    {tr.name}{" "}
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {tr.artists.map((a) => a.name).join(", ")}
                    </span>
                  </li>
                )
              )}
            </ol>
          )}
          {reorderedTracks.length > 0 && (
            <button onClick={updatePlaylistOrder}>
              Create Reordered Spotify Playlist
            </button>
          )}
        </div>
      ) : currentStep === "listen" ? (
        <div>
          <h3>Saved! Listen to the reordered playlist here</h3>
          {loading ? (
            <LoaderContainer />
          ) : (
            <iframe
              data-testid="embed-iframe"
              style={{ borderRadius: "12px" }}
              src={`https://open.spotify.com/embed/playlist/${savedPlaylist}?utm_source=remix`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"></iframe>
          )}
          <button
            onClick={resetSelections}
            style={{ marginTop: "0.5rem" }}>
            Back to start
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ReorderPlaylists;
