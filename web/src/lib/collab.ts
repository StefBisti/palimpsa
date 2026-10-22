const protocol = location.protocol === "https:" ? "wss:" : "ws:";
export const COLLAB_URL = `${protocol}//${location.host}/collab`;
