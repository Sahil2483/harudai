# Testing

## Sample data
Test images are in `sample-data/`.

## Test cases
| # | Test | Steps | Expected result |
|---|---|---|---|
| 1 | Diseased apple leaf | Select Apple, upload a diseased leaf | Disease, severity and advice are shown |
| 2 | Healthy leaf | Upload a healthy leaf | Reported as healthy or low severity |
| 3 | Non-crop photo | Upload an unrelated image | "Not a crop photo" message |
| 4 | Language toggle | Switch Urdu, Hindi, Hinglish, English | All fields change language |
| 5 | Listen | Tap Listen in each language | Result is read aloud |
| 6 | Camera and gallery | Use both upload options on a phone | Picker opens and preview shows |
| 7 | Live weather | Allow location on the Weather screen | Local temperature, humidity and rain shown |
| 8 | Location denied | Deny location permission | Default location is shown |
| 9 | Large image | Upload an image over 5 MB | Error message, no crash |
| 10 | Secrets | Search the repository for the API key | Not found |
