import { Response } from "express";
/**
 * Sets both the access token and refresh token cookies.
 * @param res The Express response object.
 * @param accessToken The JWT access token.
 * @param refreshToken The JWT refresh token.
 */
export declare const setAuthCookies: (res: Response, accessToken: string, refreshToken: string) => void;
/**
 * Sets only the access token cookie.
 * @param res The Express response object.
 * @param accessToken The JWT access token.
 */
export declare const setAccessTokenCookie: (res: Response, accessToken: string) => void;
/**
 * Clears both the access token and refresh token cookies.
 * @param res The Express response object.
 */
export declare const clearAuthCookies: (res: Response) => void;
//# sourceMappingURL=cookie.d.ts.map