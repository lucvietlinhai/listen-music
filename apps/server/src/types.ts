export type AuthTokenPayload = {
  userId: string;
  name: string;
  isGuest: boolean;
  role: "guest" | "member" | "host";
};

export type Room = {
  id: string;
  name: string;
  hostId: string;
  isPublic: boolean;
  passwordHash?: string;
  createdAt: string;
};

export type PublicRoom = Omit<Room, "passwordHash">;

export type YoutubeVideo = {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
};

