import app, { ensureReady } from "../server/index.js";

export default async function handler(req, res) {
  try {
    await ensureReady();
  } catch (error) {
    console.error("API initialization failed:", error);
    return res.status(503).json({
      ok: false,
      message: "Login service is unavailable because the production database is not configured or reachable."
    });
  }
  return app(req, res);
}
