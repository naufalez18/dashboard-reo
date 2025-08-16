import { Local, Client } from "~backend/client";

// Fallback agar tetap jalan walau VITE_CLIENT_TARGET belum diset
const TARGET =
  import.meta.env.VITE_CLIENT_TARGET ||
  (typeof window !== "undefined" ? window.location.origin : Local);

export default new Client(TARGET, {
  requestInit: { credentials: "include" },
});
