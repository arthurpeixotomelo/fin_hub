import { Hono } from "hono";
import { Buffer } from "node:buffer";
import { databricksAPI } from "../utils/databricks";

const CHUNK_SIZE = 4 * 1024 * 1024;

const dbfsPath = "/dbfs/app/previa/";

const uploadToDB = new Hono();

uploadToDB.post("/", async (ctx) => {
    try {
        const formData = await ctx.req.formData();
        const file = formData.get("file") as File;
        if (!file) {
            return ctx.json({ error: "Missing file" }, 400);
        }
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        let handle: number | null = null;
        try {
            const createRes = await databricksAPI({
                method: "POST",
                apiPath: "/api/2.0/dbfs/create",
                body: {
                    path: dbfsPath,
                    overwrite: true,
                },
            });
            handle = createRes.handle;
            if (!handle) throw new Error("Failed to get DBFS handle");

            for (
                let offset = 0;
                offset < fileBuffer.byteLength;
                offset += CHUNK_SIZE
            ) {
                const chunk = fileBuffer.subarray(offset, offset + CHUNK_SIZE);
                const base64 = chunk.toString("base64");
                await databricksAPI({
                    method: "POST",
                    apiPath: "/api/2.0/dbfs/add-block",
                    body: {
                        handle,
                        data: base64,
                    },
                });
            }

            await databricksAPI({
                method: "POST",
                apiPath: "/api/2.0/dbfs/close",
                body: { handle },
            });

            return ctx.json({ success: true, path: dbfsPath }, 200);
        } catch (error: unknown) {
            console.error("uploadToDB error:", error);
            if (handle) {
                try {
                    await databricksAPI({
                        method: "POST",
                        apiPath: "/api/2.0/dbfs/close",
                        body: { handle },
                    });
                } catch (err) {
                    console.error("close handle error:", err);
                }
            }
            return ctx.json({ error: (error as Error).message }, 500);
        }
    } catch (err) {
        return ctx.json({ error: (err as Error).message }, 400);
    }
});

export default uploadToDB;
