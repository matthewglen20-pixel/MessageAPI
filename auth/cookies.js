export const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms;

export function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // JS cannot read it
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "lax",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("refreshToken");
}
