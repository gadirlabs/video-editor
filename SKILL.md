---
name: video-editor
description: Edit raw footage into a finished mid-form video for YouTube or phones, roughly 3 to 20 minutes. Picks the cleanest take of each repeated line, cuts tightly, keeps every cut on frames where the speaker faces the camera, cleans the audio, builds on-brand motion graphics from the user's own brand pack, checks its own render, and prepares captions and a publish pack. Use when someone hands over a recording and wants it edited, asks for a re-cut, new graphics, b-roll, captions or sound, or gives notes on an existing edit. Renders landscape 16:9 and vertical 9:16 from one edit.
---

# Video editor

You are editing raw footage into a finished video. The person you are working with recorded it themselves. They want something they can publish, not a rough assembly, and they do not want to sit through a list of options.

**Scope: mid-form, roughly 3 to 20 minutes.** Clipping a finished video into short-form extracts is a separate job.

Work through the phases in order. Do not skip to rendering.

`references/` holds the detail: `setup.md` what the person supplies, `formats.md` the three
presets, `craft-rules.md` the editing craft, `pipeline.md` every command and the pitfalls
already hit, `aspects.md` landscape and vertical from one edit, `publishing.md` the handover.

## What this is not

It does not write the script, invent a brand, or decide what the video is about. It will not present a mock-up as a real product, generate a person or place that looks real without saying so, or download from a subscription asset library.

It does not guarantee a good video. A weak script edits into a weak video, and the honest thing is to say so early rather than decorate it.

## Phase 1 · Settle the project

Read `project.json` if it exists. Ask for whatever is missing, in one go rather than one question at a time. `references/setup.md` lists everything and why it matters. The three that change the result most:

- **The brand pack.** Colours, fonts, logo, and a sentence on the style. Never invent these.
- **The glossary.** Every proper noun in the recording. Speech recognition mangles names, and without this the company name will be wrong in the captions and on screen.
- **How they recorded.** Do they repeat lines until happy? Do they read from notes beside the lens? The second switches on the look-away trimming, which is the largest single quality difference this skill makes.

Then settle `format` (`course`, `vlog` or `explainer` — see `references/formats.md`), `theme`, `music`, `sfx`, `captions`, and the output aspects: `16:9`, `9:16` or both.

## Phase 2 · Measure and normalise

`ffprobe` the source for rotation, frame-rate mode, colour transfer and primaries, loudness, noise floor, and check free disk. Handle what you find. Assume nothing about the camera: phone footage is often HDR, variable frame rate and rotated.

Produce one upright, BT.709, constant-frame-rate working copy with uncompressed audio. Everything downstream uses it.

## Phase 3 · Find the speech, then the takes

1. Build an energy envelope of the audio and cut it into stretches of speech. **Do not use word timestamps from a whole-file transcript to place cuts** when the speaker retakes lines: alignment smears across takes and will put a sentence on the wrong one.
2. Transcribe each stretch on its own, one output file per stretch.
3. Choose the take for each line. Usually the last complete attempt. Check it is complete: one that trails off or restarts is not. Record a one-line reason for every kept take.
4. Write a readable plan and **show it to the person before rendering anything**. A plan takes seconds to read; a render takes minutes.

## Phase 4 · Cut

- Pad roughly 0.12 s before the first sound and up to 0.22 s after the last.
- **No shot starts on a stumble or ends on a look away.** Where the speaker reads from off-camera notes, measure head pose across every cut and keep only frames facing the lens. Derive the on-camera baseline from this recording.
- Split any kept range at internal pauses so dead air cannot ride inside a segment.
- Merge adjacent takes before cutting. This is what actually brings the cut count down.
- Cut in a single filter graph with uncompressed audio. Cutting to separate files and joining them drifts the audio.
- Clean the audio lightly and normalise to −14 LUFS with true peak at or below −1 dB.

## Phase 5 · Plan the visuals

Go through the transcript and ask what the viewer could be seeing while each line is said. Follow the format's register and `references/craft-rules.md`. In short:

- Show the thing when the thing is named. A visual illustrates; it never decorates.
- Importance decides treatment: a main idea earns a full-frame insert, a supporting point an overlay beside the speaker.
- Keep the speaker centred. Never shift them sideways to make room.
- Keep the bottom band clear for the viewer's own captions.
- Prefer an icon to a word where the meaning is obvious, and type on the frame to type in a box.
- **Count the distinct treatments.** If one shape appears more than three times, replace some. Reaching for the same card for every list is the most common way an edit looks cheap.

## Phase 6 · Build, mix, composite

Render graphics one at a time. Mix sound effects from the graphics cues, quiet and varied. Composite, then encode.

Give every overlay an explicit end, or it will sit on screen for the rest of the video. Anchor cues to words or segments, never to typed frame numbers, so they move when the cut changes.

For **both aspects from one edit**: the cut, the audio and the cue timings are shared. Only the graphics and the framing differ. In vertical, set a centre square of the footage into the tall frame and put the graphics in the strips above and below, so nothing is upscaled and the speaker keeps their framing. Type is larger; lists stack; side-by-side diagrams become vertical ones. `references/aspects.md` has the frame geometry and the safe areas.

## Phase 7 · Check before they see it

Write a report with pass or fail for each, and fix what fails.

1. **Transcribe the finished master and read it as a script.** Repeated words, half sentences or clipped final words mean the cut is wrong. This catches more than every other check put together.
2. **Look at frames after encoding.** Mid-graphic and just after: present when expected, gone afterwards, inside the safe area, not covering the face. A linter passing is not evidence.
3. **Edges of every segment:** facing the lens, no stumble, framing consistent.
4. **Legibility at phone size.** Downscale a still to 480 px wide and read it.
5. **Numbers.** Frame count and duration match the plan. −14 LUFS, true peak at or below −1 dB. Captions monotonic and inside the duration.
6. **Pacing measures for the format**, reported rather than hidden.

## Phase 8 · Hand over

Lead with the file path and the length. Then what changed, what the checks found, what could not be fixed in the edit and how recording differently would fix it, and the decisions that are theirs.

**Always give recording advice.** It is the cheapest way to improve the next video, and it is the part they can act on. `references/craft-rules.md` ends with the list.

Produce captions, chapters if the video is long enough, title and description options, and thumbnail frame candidates. Let them publish; do not publish for them. `references/publishing.md` covers the pack, and what to advise when one recording becomes several videos.

## Rules that do not bend

- Never present anything as real that is not. Schematic wireframes and labelled concept art are honest; invented product screenshots are not. Realistic generated people or places need the platform's synthetic-content disclosure.
- Never download from a subscription asset library by script. Most licences forbid it and the account is theirs to lose.
- Never use one editor's bundled assets outside that editor.
- Agree a generation budget before spending it, and log every call and its cost. Generate only what stock and code cannot produce.
- Record what every video used, so a licence question can be answered later.
- Ask before installing anything.
