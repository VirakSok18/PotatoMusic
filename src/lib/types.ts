export interface Track {
  videoId: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  duration: number; // seconds
  artwork: string;
}

export interface ArtistSummary {
  artistId: string;
  name: string;
  artwork: string;
}

export interface AlbumSummary {
  albumId: string;
  name: string;
  artist: string;
  year?: number | null;
  artwork: string;
}

export interface ArtistDetail {
  artistId: string;
  name: string;
  artwork: string;
  topSongs: Track[];
  albums: AlbumSummary[];
  singles: AlbumSummary[];
  similarArtists: ArtistSummary[];
}

export interface AlbumDetail {
  albumId: string;
  name: string;
  artist: string;
  artistId?: string;
  year?: number | null;
  artwork: string;
  tracks: Track[];
}

export interface MusicShelf {
  id: string;
  title: string;
  subtitle: string;
  tracks: Track[];
}

export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface LyricsResponse {
  synced: LyricLine[];
  plain: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  tracks: Track[];
}
