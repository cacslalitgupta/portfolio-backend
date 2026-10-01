import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import { connectDb } from "./db.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "../../client/dist");
const app = express();
const PORT = Number(process.env.PORT || 6333);

app.disable("x-powered-by");

// --------------------------------------------------
// Security
// --------------------------------------------------

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
        ],
        connectSrc: [
          "'self'",
          "https://calalitgupta.in",
          "https://www.calalitgupta.in",
        ],
      },
    },
  })
);

// --------------------------------------------------
// CORS
// --------------------------------------------------

const allowedOrigins = [
  "https://calalitgupta.in",
  "https://www.calalitgupta.in",
  "http://localhost:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without Origin header
      // such as server-to-server / health checks.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// --------------------------------------------------
// Body parser
// --------------------------------------------------

app.use(
  express.json({
    limit: "100kb",
  })
);

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ca-firm-api",
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------

app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

// --------------------------------------------------
// API 404
// --------------------------------------------------

app.use("/api", (_req, res) => {
  res.status(404).json({
    message: "Not found.",
  });
});

// --------------------------------------------------
// Serve React frontend if dist exists
// --------------------------------------------------

if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(
      path.join(dist, "index.html")
    );
  });
}

// --------------------------------------------------
// Error handler
// --------------------------------------------------

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON.",
    });
  }
  res.status(500).json({
    message: "Internal server error.",
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

async function startServer() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDb();
    console.log("MongoDB connected.");
    app.listen(PORT, () => {
      console.log(
        `CA firm API running on port ${PORT}`
      );
      console.log(
        `Client origin: ${process.env.CLIENT_ORIGIN || "not configured"}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start CA firm API:"
    );
    console.error(error);
    process.exit(1);
  }
}
startServer();
