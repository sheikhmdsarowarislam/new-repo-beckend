interface Config {
    port: number;
    nodeEnv: string;
    database_url: string;
    jwt_access_secret: string;
    jwtRefreshSecret: string;
    cloudinary_cloud_name: string;
    cloudinary_api_key: string;
    cloudinary_api_secret: string;
    redis_url: string;
}
declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map