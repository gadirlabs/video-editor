# Landscape and vertical from one edit

Set `"aspects": ["16:9", "9:16"]` in `project.json` and both masters come out of the same
edit. The cut, the audio, the sound cues and every graphic's timing are shared. Only the
framing and the layout of the graphics differ.

This is not the same as clipping a finished video into shorts. It is the whole video in two
shapes, for a viewer who will watch it on a phone held upright.

## How the vertical frame is built

The footage is cropped to a centre square and set into the tall frame, a little above
centre. The brand ground fills the strips above and below, and that is where the graphics
live.

```
 ┌──────────────┐  0
 │   strip      │     graphics: title, eyebrow, headline
 ├──────────────┤  372
 │              │
 │   footage    │     a 1080×1080 centre crop of the landscape cut, unscaled
 │              │
 ├──────────────┤  1452
 │   strip      │     graphics: lists, steps, captions
 └──────────────┘  1920
```

**Why not fill the frame.** Filling 1080×1920 from 1920×1080 footage means cropping to
608 px wide and blowing it up 78 per cent. That throws away two thirds of the picture and
softens the face, which is the first thing a viewer looks at, and it destroys any framing
composed on the day. The square keeps every pixel at its original size.

The strips are not wasted space. They are where the graphics go, so the speaker is never
covered — which in the landscape frame is a constant negotiation and here is free.

## What changes in the graphics

Same slot kinds, same cue times, different components. `src/vertical.tsx` implements every
kind that `src/landscape.tsx` does.

- **Type is larger.** A phone at arm's length is a much smaller visual angle than a laptop.
  Headings run about 80 to 90 px against 60 to 70 in landscape.
- **Rows become columns.** A three-step flow that runs left to right in landscape stacks
  vertically. A side-by-side comparison becomes one above the other.
- **Safe areas are platform chrome, not the frame edge.** Captions, buttons and the
  account handle eat roughly the bottom 260 px and the top 120. Keep content between
  150 and 1660.
- **Overlays paint only the strips.** The middle of the frame must stay transparent or it
  covers the footage. This is the one bug that is easy to write and invisible in a still
  rendered against a white background — check a composited frame, not a graphic on its own.
- **Full-frame inserts still take the whole frame**, strips included. A diagram that owns
  the moment does not need the speaker in it.

## Order of work

Render landscape first. The vertical pass reuses `work/cut.mov`, `work/cut-final-sfx.wav`
and `slots.json` exactly as they are, so any change to the cut must happen before either.

```
python3 scripts/composite.py          # out/<name>-16x9.mp4
python3 scripts/vertical.py stills    # review the layouts
python3 scripts/vertical.py           # out/<name>-9x16.mp4
```

Check both. `verify.py` takes either master, and the legibility check matters more for the
vertical one, not less: the graphics are larger but so is the chance that a platform's own
interface lands on top of them.

## What the vertical pass costs

About the same as the landscape one. On a 2:11 video: roughly a minute of compositing, and
50 MB against the landscape master's 86 MB. It comes out smaller because the strips are
flat brand colour where the landscape frame carries moving footage edge to edge.

**Give the background an explicit duration.** The base of the vertical graph is a synthetic
`color` source rather than the footage, and a `color` source without `d=` is *infinite*.
Because it is the main input to the first overlay, the whole render then has no end: it
produces a growing file until the machine runs out of memory, with no error and nothing in
the log to say why. The only symptom is a finish time that keeps receding. `vertical.py`
sets `d=` from the edit's own frame count and pins `-frames:v` as a second guard.

This is worth knowing beyond this one script. The landscape path never had the problem
because its base is the real cut, which ends by itself. Any time you swap a real input for
a synthetic one — `color`, `nullsrc`, `testsrc`, `anullsrc` — you take on the job of saying
when it stops.
