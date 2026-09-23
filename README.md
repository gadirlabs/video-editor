# Video editor

A Claude skill that edits raw footage into a finished video for YouTube or phones, roughly
three to twenty minutes long.

You hand it a recording where you said each line a few times. It picks the cleanest take of
each, cuts tightly, keeps every cut on frames where you are facing the camera, cleans the
audio, builds motion graphics in your own brand, checks its own work, and gives you the
file plus captions and a publish pack. Landscape and vertical come out of the same edit.

Free and MIT-licensed. Everything runs on your machine: ffmpeg, whisper.cpp, Node and
Python. No account, no upload, no per-minute cost.

## Install

```bash
git clone https://github.com/gadirlabs/video-editor.git ~/.claude/skills/video-editor
cd ~/.claude/skills/video-editor/graphics && npm install
```

You also need `ffmpeg` (version 8 or later), `whisper.cpp` with a model, Node 20+ and
Python 3.11+. `references/setup.md` has the details, and the skill checks before it starts.

Then, in Claude Code, point it at a recording:

> Edit `raw/lesson-01.mov` into a course video. Brand pack is in `assets/`.

## What you supply

Three things matter more than the rest, and the skill will ask for them:

**A brand pack.** Colours, fonts, logo, and a sentence describing the style. It will not
invent a look for you.

**A glossary.** Every proper noun in the recording. Speech recognition mangles names every
time, and without this your company name is wrong in the captions and on screen.

**How you recorded.** Do you repeat lines until you are happy? Do you read from notes beside
the lens? The second switches on look-away trimming, which is the single biggest quality
difference this makes.

`references/setup.md` lists everything else, including the optional
[fal.ai](https://fal.ai) key for generated clips.

## What it actually does

Eight phases, in `SKILL.md`. The parts worth knowing about:

**It finds the takes from the audio, not the transcript.** When you say a line four times,
word timestamps from a whole-file transcript smear across the attempts, and a cut placed on
those timings lands inside the wrong take. The skill builds an energy envelope, splits it
into stretches of sound, and transcribes each stretch separately. The words come after the
timing, never before it.

**It will not cut to a frame where you are looking away.** If you read from notes beside the
lens, it measures head pose across every cut and keeps only frames facing the camera. On the
first real video this trimmed 24 of 38 segments. Nothing else in the pipeline changes the
finished result as much.

**It shows you the plan before it renders anything.** A table of every take, where it came
from, and one line on why that take. Reading it takes seconds; a render takes minutes.

**It checks its own output.** It transcribes the finished master and reads it back as a
script, looks at frames after encoding rather than trusting that the code was right,
measures loudness, and reads a still downscaled to phone size. The transcript check has
caught more real defects than every other check put together.

**Both aspects from one edit.** The cut, the audio and the cue timings are shared. In
vertical it sets a centre square of the footage into the tall frame and puts the graphics in
the strips above and below, so nothing is upscaled and you keep the framing you composed on
the day.

## What it will not do

It does not write your script, invent your brand, or decide what the video is about. A weak
script edits into a weak video, and it will say so rather than decorate it.

It will not present a mock-up as a real product, generate a realistic person or place
without saying so, or script downloads from a subscription asset library — most licences
forbid that and the account is yours to lose.

## Portability

Built and tested on macOS on Apple Silicon. Two steps use Apple frameworks: hardware colour
conversion, and the face detection behind look-away trimming. On Linux or Windows those need
substituting — MediaPipe Face Mesh writing the same `work/gaze.json` is the direct
replacement — and the skill says so rather than pretending. Everything else is ffmpeg, Node
and Python.

## Layout

```
SKILL.md                  the skill itself
references/
  setup.md                what you supply, and why each thing matters
  formats.md              course, vlog, explainer — and what changes between them
  craft-rules.md          where a cut goes, how to hide one, what a graphic is for
  pipeline.md             every command, what it costs, and the pitfalls already hit
  aspects.md              landscape and vertical from one edit
  publishing.md           captions, chapters, thumbnails, and filming once for many parts
scripts/                  the pipeline, from normalise to verify
graphics/                 a Remotion renderer that reads your brand
project.example.json      copy to project.json
keep.example.json         the take choices
slots_plan.example.py     the graphics plan
```

## Licence

MIT. See `LICENSE`.

Built at [GadirLabs](https://gadirlabs.io) while making a course, and published because the
hard-won parts — the take selection, the gaze trimming, the self-checks — are the same for
anyone editing a talking head.
