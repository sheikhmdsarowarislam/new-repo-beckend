import jwt from "jsonwebtoken";
export interface ITokenPayload {
  id: string;
  role: string;
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Function to generate an access token
export const generateAccessToken = (payload: ITokenPayload): string => {
  if (!JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN } as any);
};

// Function to generate a refresh token
export const generateRefreshToken = (payload: ITokenPayload): string => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as any);
};

// Function to verify an access token
export const verifyAccessToken = (token: string): ITokenPayload => {
  if (!JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }
  // The 'as any' casting is no longer needed
  const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as ITokenPayload;
  return decoded;
};

// Function to verify a refresh token
export const verifyRefreshToken = (token: string): ITokenPayload => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as ITokenPayload;
  return decoded;
};