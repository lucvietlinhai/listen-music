export type Room = {
  id: string;
  name: string;
  currentSong: string;
  channelName: string;
  listeners: number;
  isPrivate: boolean;
  thumbnail: string;
};

export type ApiRoom = {
  id: string;
  name: string;
  hostId: string;
  isPublic: boolean;
  createdAt: string;
};
