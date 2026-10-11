# Harud AI

AI crop-disease detection for apple, walnut and saffron growers in Kashmir. Upload a photo of a leaf or fruit and get the likely disease, cause, treatment and prevention advice in Urdu, Hindi, Hinglish or English, with read-aloud.

Hack for Social Cause (VBYLD 2027) | Theme: Rural Development & Livelihoods

## Features
- Photo-based disease detection (camera or gallery)
- Cause, treatment, prevention and weather-risk advice
- Urdu, Hindi, Hinglish and English, with read-aloud
- Live weather for the user's location with a disease-risk guide

AI output is guidance, not a final diagnosis. The confidence value is an AI estimate, not a measured accuracy.

## Setup
1. Create a Gemini API key at https://aistudio.google.com/apikey
2. Create a Cloudflare Worker and deploy `worker/worker.js`.
3. Configure the Worker:

| Name | Type | Description |
|---|---|---|
| `GEMINI_API_KEY` | Secret | Gemini API key |
| `ADMIN_PASSWORD` | Secret | Admin panel password |
| `ADVISORIES` | KV namespace binding | Stores advisories and admin edits |

4. Set the Worker URL in `index.html` (`ANALYZE_ENDPOINT`).
5. Serve the files over HTTPS (for example GitHub Pages).

## Project structure
```
index.html        Farmer app
worker/worker.js  API (Cloudflare Worker)
ARCHITECTURE.md   Technical design
TESTING.md        Test cases and sample data
sample-data/      Test images
LICENSE
```

## Privacy
Photos are sent to the Worker and then to Google Gemini for analysis and are not stored by this project. Location is used only to fetch weather and is not stored.

## Credits
Weather: Open-Meteo. AI: Google Gemini. Images: Wikimedia Commons.

## License
MIT
