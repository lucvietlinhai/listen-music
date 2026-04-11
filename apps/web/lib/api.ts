const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type AuthResponse = {
  token: string;
  user?: ApiAuthUser;
};

type ApiRoom = {
  id: string;
  name: string;
  hostId: string;
  isPublic: boolean;
  createdAt: string;
};

type CreateRoomPayload = {
  name: string;
  isPublic: boolean;
  password?: string;
};

export type ApiAuthUser = {
  userId: string;
  name: string;
  isGuest: boolean;
  role: "guest" | "member" | "host";
  email?: string;
  avatar?: string;
};

const AUTH_TOKEN_KEY = "lwm_auth_token";
const AUTH_USER_KEY = "lwm_auth_user";

const getStoredAuthToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

const setStoredAuthToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

const setStoredAuthUser = (user: ApiAuthUser) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getStoredAuthUser = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiAuthUser;
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
};

export const getAuthToken = async () => {
  const existing = getStoredAuthToken();
  if (existing) return existing;

  const response = await fetch(`${API_BASE_URL}/api/auth/guest`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Khong the lay token");
  }

  const json = (await response.json()) as AuthResponse;
  setStoredAuthToken(json.token);
  if (json.user) {
    setStoredAuthUser(json.user);
  }
  return json.token;
};

export const getGuestToken = getAuthToken;

export const loginWithGoogle = async (idToken: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idToken })
  });

  if (!response.ok) {
    throw new Error("Dang nhap Google that bai");
  }

  const json = (await response.json()) as AuthResponse;
  setStoredAuthToken(json.token);
  if (json.user) {
    setStoredAuthUser(json.user);
  }

  return json;
};

export const fetchRooms = async () => {
  const response = await fetch(`${API_BASE_URL}/api/rooms`, {
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error("Khong the tai danh sach phong");
  }

  const json = (await response.json()) as { rooms: ApiRoom[] };
  return json.rooms;
};

export const createRoom = async (payload: CreateRoomPayload) => {
  const sendCreate = async (token: string) =>
    fetch(`${API_BASE_URL}/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

  let token = await getAuthToken();
  let response = await sendCreate(token);

  if (response.status === 401) {
    clearAuthSession();
    token = await getAuthToken();
    response = await sendCreate(token);
  }

  if (!response.ok) {
    throw new Error("Khong the tao phong");
  }

  return (await response.json()) as ApiRoom;
};
