<div align="center">
   <h1>🎓 AI Learning Assistant</h1>
   <p>A lightweight web app that helps instructors monitor classroom clarity in real-time using Gemini AI.</p>
   <p>
      <a href="https://github.com/Bastistr99/AI-Learning-Assistant"><img src="https://img.shields.io/badge/github-Bastistr99-24292e" alt="GitHub"/></a>
      <a href="https://github.com/Bastistr99/AI-Learning-Assistant/actions"><img src="https://img.shields.io/badge/actions-ci-blue" alt="CI"/></a>
   </p>
</div>

**Overview**

- **What it does:** Monitors a live classroom camera feed, analyzes student faces and scene context with Gemini, and produces a live "Clarity" score (0–100%), engagement metrics, and concise teaching tips when confusion is detected.
- **Main flows:** Live speaker view with slide control, AI tips and toast notifications, and post-lecture summaries.

**Features**

- **Live Clarity Meter:** Displays a real-time clarity percentage (higher = clearer class).
- **AI Suggestions:** Short, actionable tips when confusion increases.
- **Post-Lecture Summary:** Generates a brief summary and improvement suggestions.
- **Privacy-conscious:** Local `.env` for secrets; `.env` is ignored by Git.

**Quick Start**

Prerequisites: Node.js (16+ recommended)

1. Install dependencies

```bash
npm install
```

2. Add your Gemini API key to `.env` in the project root:

```bash
# .env
API_KEY=your_gemini_api_key_here
```

3. Start the dev server

```bash
npm run dev
```

4. Open the app in your browser (default port 3000):

http://localhost:3000

**Usage Notes**

- **Camera access:** The app captures a local camera frame for analysis. Grant browser permission when prompted.
- **Live session:** Use the Speaker View to advance slides, and watch the Live Clarity widget update. AI suggestions appear in the Speaker Notes panel and as a toast.
- **Logs:** Server console prints Gemini responses and computed clarity for debugging.

**Environment & Secrets**

- **Env var name:** `API_KEY` — store your Gemini key in `.env`.
- **Security:** The repository contains a `.gitignore` that excludes `.env` and other local artifacts. Do not commit secrets.

**Troubleshooting**

- **Clarity displays `NaN`**: Ensure `API_KEY` is set in `.env`, restart the dev server, and confirm the browser granted camera access. If the problem persists, check terminal logs for the Gemini response.
- **API errors / no response:** Verify the API key, network connectivity, and that the Gemini model names in `services/geminiService.ts` match your account access.

**Deployment**

- Build for production:

```bash
npm run build
```

- Serve the `dist/` output with any static host (Vercel, Netlify, or a simple Node server).

**Contributing**

- Bug reports and PRs are welcome. Please keep secrets out of commits and follow standard GitHub workflow.

**License**

- MIT — see LICENSE for details.

----

If you'd like, I can also add screenshots, a demo GIF, or update the repo description to match this README.
