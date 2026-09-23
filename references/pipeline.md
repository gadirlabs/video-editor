# The pipeline

The scripts stay in the skill and are run **from the project folder** — the one holding
`project.json`, `keep.json`, `slots_plan.py` and `raw/`. Nothing is copied per video, so a
fix to a script reaches every project at once.

```bash
export VE=~/.claude/skills/video-editor     # wherever the skill is installed
cd ~/videos/lesson-01                       # the project folder
```

Each step writes files the next one reads, so the order matters and every step can be re-run
on its own.

| Step | Command | Writes |
|---|---|---|
| Measure and normalise | `python3 $VE/scripts/normalise.py raw/<file>` | `work/source.mov`, `work/audio16k.wav` |
| Find the speech | `uv run --with numpy python $VE/scripts/islands.py` | `work/islands.json` |
| Transcribe each stretch | `python3 $VE/scripts/transcribe.py` | text into `work/islands.json` |
| Choose the takes | edit `keep.json`, then `python3 $VE/scripts/build_edit.py` | `lesson.edit.json`, `plan.md` |
| Face the camera | `uv run --with pyobjc-framework-Vision python $VE/scripts/gaze.py`, then `$VE/scripts/gaze_trim.py`, then `build_edit.py` again | `work/gaze.json`, `work/gaze_trim.json` |
| Cut | `python3 $VE/scripts/cut.py` | `work/cut.mov` |
| Audio | `python3 $VE/scripts/audio.py` | `work/cut-final.wav` |
| Graphics | edit `slots_plan.py`; `graphics.py plan`, then `stills`, then `render` | `slots.json`, `graphics/*.mov` |
| Sound effects | `python3 $VE/scripts/sfx.py` | `work/cut-final-sfx.wav` |
| Landscape master | `python3 $VE/scripts/composite.py` | `out/<name>-16x9.mp4` |
| Vertical master | `python3 $VE/scripts/vertical.py` | `out/<name>-9x16.mp4` |
| Check | `python3 $VE/scripts/verify.py out/<name>-16x9.mp4` | `verify/` |
| Captions | `whisper-cli … -ml 80 -sow -osrt`, then correct the names | `publish/captions.srt` |

The scripts find the Remotion renderer inside the skill folder. Set `graphics_dir` in
`project.json` only if you keep a modified copy of it somewhere else.

Build the edit **twice**: once without `work/gaze_trim.json` so that `gaze.py` knows which
frames to measure, and again afterwards so the trims are applied.

## What to expect it to cost

Measured on one machine — an M1 Pro with 16 GB — on a 7:51 source that cut to 2:11.

- Normalise: about 2 minutes. whisper.cpp `large-v3-turbo`: 142 s for 471 s of audio, 1.9 GB
  peak memory.
- Single-pass cut of 40 segments: 42 s.
- Head pose on 3,325 frames: 78 s. It only measures near cuts, which is why it is minutes
  rather than hours.
- Sixteen graphics clips: about 3 minutes and 300 MB, 670 MB peak.
- Composite and encode at CRF 17: about 2 minutes landscape, longer vertical.
- The working copy is roughly 190 MB per minute of source. Check free disk first;
  `normalise.py` does.

## Pitfalls already hit, so you do not have to

**ffmpeg 8 renamed two flags.** `-filter_complex_script FILE` became `-/filter_complex FILE`,
and `-vsync` became `-fps_mode`. The scripts use the current spellings. On ffmpeg 7 or
earlier, swap them back.

**A long `select` expression fails silently-ish.** Asking for two hundred specific frames in
one `select='eq(n,1)+eq(n,2)+…'` exits with code 244 and no useful message. Batch it, 40
frames per call.

**Whisper echoes its prompt.** Give whisper.cpp a vocabulary prompt and a near-silent clip
comes back as your vocabulary list. Transcribe without a prompt and correct proper nouns
afterwards by text replacement, where nothing can be invented.

**One output file per clip.** `-otxt` across several inputs, or a combined output, puts the
text out of step with the audio it came from.

**Per-file concat drifts the audio.** Cutting each segment to its own file and joining them
rounds each start to a frame boundary; the errors accumulate until the voice is behind the
mouth. Cut in one filter graph with PCM audio.

**`alimiter` applies make-up gain by default.** Add `level=0` or the finished mix comes back
about 1.5 dB above the loudness you just normalised to.

**`repeatlast=0` and `eof_action=pass` on every overlay.** Without them a card either
freezes on screen for the rest of the video or ends the stream where it stops.

**Alpha does not survive the browser.** ProRes 4444 with alpha does not render from a
`<Video>` tag, and Chrome drops WebM alpha. Key generated clips in ffmpeg at composite time
with `colorkey`, and skip `despill` — `despill=type=green` turned an orange mascot red.

**Animations must be driven by `useCurrentFrame()`.** CSS transitions, `requestAnimationFrame`
and spring libraries do not render deterministically; the output is a still image or a
stutter. GSAP needs `@remotion/gsap`.

**Remotion settings that work:** `--concurrency=2`, `--timeout=120000`. Overlay clips need
`--codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png`.

**Check the machine before a long render.** A load average over 50 makes renders time out,
and the cause is usually something else on the machine rather than the render.
