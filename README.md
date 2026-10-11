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
Requirements: a Cloudflare account and a Google Gemini API key.

1. Deploy `worker/worker.js` as a Cloudflare Worker.
2. Configure the Worker environment:

| Variable | Type |
|---|---|
| `GEMINI_API_KEY` | Secret |
| `ADMIN_PASSWORD` | Secret |
| `ADVISORIES` | KV namespace binding |

3. Set the Worker URL in `index.html` (`ANALYZE_ENDPOINT`).
4. Host the files over HTTPS (for example GitHub Pages).

## Roadmap
- Collect and label our own dataset of apple, walnut and saffron disease images from Kashmir orchards. Data from agricultural institutions such as SKUAST-Kashmir will be requested and used only with permission.
- Train and build our own disease-detection model on this dataset, replacing the current general-purpose AI model.
- Evaluate the model on a held-out test set and validate results with agricultural experts.
- Add Kashmiri language support and offline detection.

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
