export interface ITokenPayload {
    id: string;
    role: string;
}
export declare const generateAccessToken: (payload: ITokenPayload) => string;
export declare const generateRefreshToken: (payload: ITokenPayload) => string;
export declare const verifyAccessToken: (token: string) => ITokenPayload;
export declare const verifyRefreshToken: (token: string) => ITokenPayload;
//# sourceMappingURL=token.d.ts.map