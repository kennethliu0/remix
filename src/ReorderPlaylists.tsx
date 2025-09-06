import React, { useEffect, useState } from "react";
import { useSpotify } from "./hooks/useSpotify";
import {
  Scopes,
  type Playlist,
  type PlaylistedTrack,
  type Track,
  type TrackItem,
  type UserProfile,
} from "@spotify/web-api-ts-sdk";

const ReorderPlaylists: React.FC = () => {
  const spotify = useSpotify(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    import.meta.env.VITE_REDIRECT_TARGET,
    Scopes.playlistModify
  );
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<Playlist<TrackItem> | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [reorderedTracks, setReorderedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
      setPlaylists(playlists.items);
      setLoading(false);
    }
    fetchPlaylists();
  }, [spotify]);

  async function handleSelectPlaylist(playlist: any) {
    if (!spotify) return;
    setSelectedPlaylist(playlist);
    setLoading(true);
    const trks = await spotify.playlists.getPlaylistItems(playlist.id);
    setTracks(
      trks.items.map((tr: PlaylistedTrack<Track>) => tr.track).slice(0, 40)
    );
    setLoading(false);
  }

  function reorderTracks() {
    const worker = new Worker(
      new URL("./utils/tspWorker.ts?worker", import.meta.url),
      {
        type: "module",
      }
    );
    const map = new Map(tracks.map((t) => [t.id, t]));
    worker.postMessage(tracks.map((t) => t.id));
    worker.onmessage = (e: MessageEvent<string[]>) => {
      setReorderedTracks(e.data.map((id) => map.get(id)!));
      worker.terminate();
    };
    return () => worker.terminate();
  }

  async function updatePlaylistOrder() {
    if (!spotify || !profile) return;
    if (!selectedPlaylist || reorderedTracks.length === 0) return;
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
      reorderedTracks.map((tr) => tr.uri)
    );
    setLoading(false);
    alert("Playlist reordered!");
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Intelligent Spotify Playlist Reorder</h2>
      {loading && <p>Loading...</p>}
      <div>
        <h3>Your Playlists</h3>
        <ul>
          {playlists.map((pl) => (
            <li key={pl.id}>
              <button onClick={() => handleSelectPlaylist(pl)}>
                {pl.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {selectedPlaylist && (
        <div>
          <h3>Tracks in {selectedPlaylist.name}</h3>
          <button onClick={reorderTracks}>Reorder Intelligently</button>
          <ul>
            {(reorderedTracks.length > 0 ? reorderedTracks : tracks).map(
              (tr) => (
                <li key={tr.id}>
                  {tr.name}{" "}
                  {tr.popularity ? `(Popularity: ${tr.popularity})` : ""}
                </li>
              )
            )}
          </ul>
          {reorderedTracks.length > 0 && (
            <button onClick={updatePlaylistOrder}>
              Update Playlist Order on Spotify
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReorderPlaylists;
