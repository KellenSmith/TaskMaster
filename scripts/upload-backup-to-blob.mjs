import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const token = process.env.BLOB_BACKUP_READ_WRITE_TOKEN;
const dumpFilePath = process.env.DUMP_FILE_PATH;
const checksumFilePath = process.env.CHECKSUM_FILE_PATH;
const dumpBlobPath = process.env.DUMP_BLOB_PATH;
const checksumBlobPath = process.env.CHECKSUM_BLOB_PATH;

if (!token || !dumpFilePath || !checksumFilePath || !dumpBlobPath || !checksumBlobPath) {
    throw new Error("Missing upload context in environment variables.");
}

const dumpContents = await readFile(dumpFilePath);
const checksumContents = await readFile(checksumFilePath, "utf8");

const [dumpBlob, checksumBlob] = await Promise.all([
    put(dumpBlobPath, dumpContents, {
        access: "private",
        token,
        addRandomSuffix: false,
        contentType: "application/octet-stream",
    }),
    put(checksumBlobPath, checksumContents, {
        access: "private",
        token,
        addRandomSuffix: false,
        contentType: "text/plain; charset=utf-8",
    }),
]);

console.log(`DUMP_URL=${dumpBlob.url}`);
console.log(`CHECKSUM_URL=${checksumBlob.url}`);
