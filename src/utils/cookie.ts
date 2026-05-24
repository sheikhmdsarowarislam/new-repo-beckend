import { Response } from "express";

// Get token expiry times from environment variables, or use defaults
const ACCESS_TOKEN_EXPIRES_IN_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isProduction = process.env.NODE_ENV === "production";

// Helper function to set a single cookie
const setCookie = (res: Response, name: string, token: string, maxAge: number) => {
  const cookieOptions: any = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax", 
    maxAge,
    path: "/", 
  };

  res.cookie(name, token, cookieOptions);
};

/**
 * Sets both the access token and refresh token cookies.
 * @param res The Express response object.
 * @param accessToken The JWT access token.
 * @param refreshToken The JWT refresh token.
 */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  setCookie(res, "accessToken", accessToken, ACCESS_TOKEN_EXPIRES_IN_MS);
  setCookie(res, "refreshToken", refreshToken, REFRESH_TOKEN_EXPIRES_IN_MS);
};

/**
 * Sets only the access token cookie.
 * @param res The Express response object.
 * @param accessToken The JWT access token.
 */
export const setAccessTokenCookie = (
  res: Response,
  accessToken: string
) => {
  setCookie(res, "accessToken", accessToken, ACCESS_TOKEN_EXPIRES_IN_MS);
};

/**
 * Clears both the access token and refresh token cookies.
 * @param res The Express response object.
 */
export const clearAuthCookies = (res: Response) => {
  const cookieOptions: any = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };


  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};