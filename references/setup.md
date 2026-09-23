# What you supply

Everything the skill needs from you, in one place. Put it in `project.json` and an `assets/` folder beside your footage. The skill asks for anything missing rather than guessing.

Only the first three are required. Everything else improves the result.

## 1. The footage

One or more recordings. The skill measures whatever arrives — rotation, frame rate, colour, loudness — and normalises it, so phone footage, a webcam capture or a screen recording are all fine.

It helps to say how it was recorded, because two habits change the edit:

- **Do you repeat lines until you are happy?** Then the skill picks the cleanest take of each. This is the default assumption.
- **Do you read from notes beside the lens?** Then it trims every cut to frames where you are facing the camera. This is the single biggest quality difference and it is off unless you say yes, because it costs a processing pass.

## 2. A brand pack

The skill will not invent a look. Give it:

| | |
|---|---|
| **Colours** | A ground, a text colour, one accent, and a lighter version of that accent for use on dark. Hex values |
| **Fonts** | A display face for headings, a body face, and a monospace face for labels. Either font files in `assets/fonts/`, or Google Fonts names |
| **Logo** | A wordmark and a mark, as SVG or transparent PNG, in light and dark versions if you have them |
| **Style** | A sentence or two. Flat or glossy, sparse or dense, gradients allowed or not, how loud the motion should be |

If you have a brand document, point at it and the skill will read it.

## 3. A glossary

**The most commonly skipped item, and the one that causes the most visible errors.** Speech recognition mangles proper nouns every time. Without a glossary your company name will appear wrong in the captions and on screen.

List every name that appears in the recording: your company, people, products, tools, libraries, places. Include the spellings the transcriber is likely to produce, if you know them.

```json
"glossary": [
  { "correct": "GadirLabs", "heard_as": ["Gade Labs", "Gadeer Lab", "Gadir labs"] },
  { "correct": "Supabase", "heard_as": ["Super base", "Supa base"] }
]
```

## 4. The format

`course`, `vlog` or `explainer`. This decides the whole visual register: how much furniture, how often the picture changes, whether repetition is a feature or a fault. See `formats.md`. If you are unsure, the skill will ask what the viewer is meant to do afterwards and choose from the answer.

## 5. Assets it can put on screen

Anything real beats anything generated. Drop into `assets/`:

- Photos of people you mention, with permission to publish
- Screenshots of the product, the tool, the article
- Logos of tools you name, if their licence allows
- **Your own b-roll.** An afternoon filming your workspace, your screen, the real work, will do more for a video than any graphic

## 6. Sound

Sound effects are optional and quiet by default. Either:

- use the small public-domain set the skill ships with, or
- point at your own library, with a note on its licence.

Music is a per-video choice: `none`, `beds_only` (under b-roll and montage, never under speech) or `throughout`.

Never point the skill at a subscription library and ask it to download. Most licences forbid automated downloading, and the account is yours to lose.

## 7. An API key, if you want generated footage

Optional. With a [fal.ai](https://fal.ai) key the skill can generate short clips. It will not spend anything without a budget you set per video, and it logs every call and its cost.

Generate only what stock and code cannot produce. A mascot animated from your own artwork is worth it; a person typing at a laptop is not, because stock has it. Realistic generated people or places need YouTube's altered-content disclosure.

## 8. Things it must not do

Tell the skill what it cannot show or imply. It already refuses to invent product screenshots or present a mock-up as real, but it does not know your constraints: an unannounced feature, a client who has not consented, a claim you cannot support.

## Example `project.json`

```json
{
  "format": "course",
  "theme": "light",
  "music": "none",
  "sfx": "sparse",
  "captions": "upload_only",
  "resolution": "1920x1080",
  "fps": 30,
  "target_length_minutes": [6, 12],
  "speaker_reads_from_notes": true,
  "stock_allowed": true,
  "generation_budget_usd": 0,
  "brand": {
    "ground": "#F4F6F8", "text": "#141B24", "accent": "#6D28D9",
    "accent_on_dark": "#A78BFA", "muted": "#7A8694", "line": "#D6DCE3",
    "fonts": { "display": "Bricolage Grotesque", "body": "Source Serif 4", "mono": "IBM Plex Mono" },
    "style": "Flat and sparse. One accent, used small. No gradients."
  },
  "glossary": [{ "correct": "GadirLabs", "heard_as": ["Gade Labs"] }],
  "never_show": ["unreleased pricing", "client names"]
}
```

## What your machine needs

- **ffmpeg** with the usual filters. Version 8 or later changed two flags the scripts already handle.
- **Node 20 or later**, for the graphics renderer.
- **Python 3.11 or later.**
- **A local speech-to-text tool.** `whisper.cpp` is the default and needs no account.

**A caveat about portability.** This was built and tested on macOS on Apple Silicon. Two steps use Apple frameworks: hardware colour conversion, and the face detection behind the look-away trimming. On Linux or Windows those need substituting, and the skill will say so rather than pretending. Everything else is ffmpeg, Node and Python.
