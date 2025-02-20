import https from "https";
import axios, { AxiosInstance } from "axios";

const globalForSwish = global as unknown as { swish: AxiosInstance };

const getCertFromEnv = (envVar: string) => Buffer.from(envVar, "base64").toString("ascii");

const getNewSwishClient = () => {
    const agent = new https.Agent({
        cert: getCertFromEnv(process.env.SWISH_SSL_CERT),
        key: getCertFromEnv(process.env.SWISH_SSL_KEY),
        ca: getCertFromEnv(process.env.SWISH_SSL_ROOT_CA),
    });
    // Using Axios as HTTP library
    return axios.create({
        httpsAgent: agent,
    });
};

const swish = globalForSwish.swish || getNewSwishClient();

export { swish };
