import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { google } from "googleapis";
import cookieParser from "cookie-parser";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  
  // Use APP_URL if provided, else fall back to request origin (though APP_URL is preferred in this environment)
  const getAppUrl = (req: express.Request) => {
    return process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  };

  const getOAuthClient = (req: express.Request) => {
    return new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      `${getAppUrl(req)}/api/auth/google/callback`
    );
  };

  // Google OAuth URL Generation
  app.get("/api/auth/google/url", (req, res) => {
    const oauth2Client = getOAuthClient(req);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'consent' // Force refresh token
    });
    res.json({ url });
  });

  // Google OAuth Callback
  app.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code as string;
    const oauth2Client = getOAuthClient(req);
    
    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      // Store tokens in a secure cookie
      res.cookie('google_tokens', JSON.stringify(tokens), {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 3600000 * 24 * 7 // 7 days
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. Closing window...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Check if authenticated
  app.get("/api/auth/google/status", (req, res) => {
    const tokens = req.cookies.google_tokens;
    res.json({ isAuthenticated: !!tokens });
  });

  // List Google Drive files
  app.get("/api/drive/files", async (req, res) => {
    const tokenStr = req.cookies.google_tokens;
    if (!tokenStr) return res.status(401).json({ error: "Not authenticated" });

    const tokens = JSON.parse(tokenStr);
    const oauth2Client = getOAuthClient(req);
    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    try {
      const response = await drive.files.list({
        pageSize: 20,
        fields: 'files(id, name, mimeType, webViewLink, iconLink)',
        q: "mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf' or mimeType = 'text/plain' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
        orderBy: 'modifiedTime desc'
      });
      res.json({ files: response.data.files });
    } catch (error) {
      console.error("Drive list error:", error);
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  // Fetch file content from Drive
  app.get("/api/drive/export", async (req, res) => {
    const fileId = req.query.fileId as string;
    const mimeType = req.query.mimeType as string;
    const tokenStr = req.cookies.google_tokens;
    
    if (!tokenStr || !fileId) return res.status(401).json({ error: "Unauthorized" });

    const tokens = JSON.parse(tokenStr);
    const oauth2Client = getOAuthClient(req);
    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
      let content = "";
      if (mimeType === 'application/vnd.google-apps.document') {
        // Export Google Doc as plain text
        const response = await drive.files.export({
          fileId: fileId,
          mimeType: 'text/plain'
        }, { responseType: 'text' });
        content = response.data as string;
      } else {
        // For PDF/DOCX, we might need more complex handling or just tell user it's better to use Google Doc
        // For now, let's try to get content for text/plain
        if (mimeType === 'text/plain') {
          const response = await drive.files.get({
            fileId: fileId,
            alt: 'media'
          }, { responseType: 'text' });
          content = response.data as string;
        } else {
          // For binary files like PDF, we'd need to send the buffer to the client
          // But since the current frontend handles PDF/DOCX via mammoth/pdfjs with local file upload,
          // it might be better to export as text or just download and pass to existing logic.
          // For simplicity in this demo, let's just support Google Docs and Text files for now.
          return res.status(400).json({ error: "Currently only supporting Google Docs and Text files via Drive import." });
        }
      }
      res.json({ text: content });
    } catch (error) {
      console.error("Drive export error:", error);
      res.status(500).json({ error: "Failed to fetch file content" });
    }
  });

  // API to fetch text from a URL
  app.get("/api/fetch-url", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style').remove();
      
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      res.json({ text });
    } catch (error) {
      console.error("Error fetching URL:", error);
      res.status(500).json({ error: "Failed to fetch content from URL" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
