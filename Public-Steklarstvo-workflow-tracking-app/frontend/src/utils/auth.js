import { jwtDecode } from "jwt-decode";

export function getCurrentUsername() {
  const token = localStorage.getItem("token");
  if (!token) return "";
  try {
    const decoded = jwtDecode(token);
    return decoded.username;
  } catch (err) {
    return "";
  }
}
