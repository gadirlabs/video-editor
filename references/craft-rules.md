# Craft rules

Read `formats.md` first: the preset decides how much of this applies.

Where these come from: editing real footage through five revisions with a demanding client,
three independent agents editing the same footage by three different published workflows,
and two research passes on editing craft. Where a number is a working opinion rather than a
measurement, it says so. Most published editing numbers are opinion.

## Choosing takes

- A speaker who repeats a line until happy usually leaves the keeper last. Check that it is
  complete: an attempt that trails off or restarts is not.
- When two takes are both complete, prefer the one said in a single fluent run, and note in
  the plan that an alternative exists.
- When a passage is re-recorded in a shorter form, the later version is the choice that was
  made. Do not restore the longer one because it explains more.
- Short restarts hide inside a stretch of sound: half a second of false start can sit a
  tenth of a second before the real sentence, too close for the envelope to separate.
  Transcribing the finished cut is what exposes them.
- Log a one-line reason for every kept take, so review is a scan rather than a re-watch.

## Where a cut goes

- Roughly 0.12 s before the first sound and up to 0.22 s after the last. Independent
  implementations converge near 120 to 200 ms in and 150 to 250 ms out for a clean pace.
- **A shot must not start on a stumble or end on a look away.** This is the most common
  defect: three separate agents editing the same footage all left stumbles and off-camera
  glances inside otherwise correct takes. Where the speaker reads from notes beside the
  lens, measure head pose across every cut, derive the on-camera baseline from that
  recording rather than from a constant, and keep only frames within a few degrees of it.
- Eyes leave before the head does. Where a look-away follows a line, end the shot as the
  sound ends rather than waiting for the head to turn.
- Head pose does not detect eye direction. If a glance survives the check, add eye tracking.

## Hiding a cut

In order of preference:

1. **A full-frame insert spanning the cut.** It starts before the cut and ends after it, so
   the join is never seen. Start it a few frames before the words it illustrates. Typical
   inserts run 2 to 5 seconds; a building diagram runs as long as its explanation.
2. **A real change of framing.** Alternate a wide shot and a tight one, 115 to 120 per cent
   on 1080p before the face softens. A 10 per cent nudge reads as an accident and is a
   known amateur tell.
3. **A plain cut** where head position matches and the speaker is on camera on both sides.

Merging adjacent takes before cutting is what actually brings visible cuts per minute down.
The best-paced trial edit reached 4.4 visible cuts a minute by merging and by hiding half
its cuts under inserts, against 14 to 16 for the others on the same footage.

No picture crossfades or morph cuts. Short audio fades at each cut are always on.

## Layout

- **Keep the speaker centred.** Never shift them sideways to make room for a graphic, and
  never let their position change between consecutive shots. Put overlays beside them, or
  punch in on the centre. Sideways reframing across consecutive shots was the single most
  distracting thing in any trial edit.
- **Importance decides the treatment.** A main idea earns a full-frame insert on a textured
  ground; a supporting point gets an overlay beside the speaker. Avoid two full-frame
  inserts back to back.
- **Open and close with cards over the shot, not full-screen cards.** Open on the speaker
  already talking, with a small corner title. Close with the next step and the mark in two
  boxes, left and right. Full-screen title and end cards read as corporate.
- **Keep the bottom band clear.** The viewer's own captions live there. Nothing persistent
  below about 900 px on a 1080 frame.
- One photo of a person is usually enough. If two are needed, stack or overlap them rather
  than pushing the speaker aside.
- Items sharing a row must belong together.
- A panel from the left followed by a panel from below is too much of the same move. Vary
  the gesture.

## The graphic vocabulary

The failure mode across every trial was reaching for the same shape every time. Three cards
with text became the answer to build/fix/deploy, to iOS/Android, to
accounts/data/bookings/payments, to generate/review/publish and to two more lists in one
video. The shape is not wrong; using it for everything is.

- **Prefer type on the frame to type in a panel.** Words arriving one by one with a soft
  shadow, sitting directly on the footage or the ground, read as more confident than the
  same words in a box. Use a panel only when the background will not carry text.
- **Icons instead of words** where the meaning is obvious: a monitor and a phone rather than
  the labels "web app" and "mobile app".
- **Real marks** where they exist and the licence allows: a platform's own logo beats a grey
  rectangle shaped like a phone.
- **Emphasis by typeface.** Bring a phrase in word by word and set the one word that matters
  in the italic body face, in the accent colour. Colour alone is a lighter alternative.
- **Vary the shape across a video.** Count the distinct treatments used; if one appears more
  than three times, replace some. `graphics.py` counts them and says so.
- Diagrams: icons, drawn connectors, a textured ground, staged reveals timed to the words.
- Animated numbers are worth having for a figure that matters.
- One persistent element can carry structure, but only in the course preset.

## Text on screen

- Text adds what the voice did not: a label, a number, a name, the shape of a list. If it
  repeats the sentence being spoken, cut it.
- Reading time about 3 s plus 0.5 to 0.7 s per word, or at least 1 s per 13 characters.
  Err long.
- Ease in over about 12 frames, out over about 5. No springs or bounces.
- Legibility at phone size is the test: downscale a still to 480 px wide and read it.

## Footage beyond the talking head

- **Show the thing when you say the thing.** An insert must illustrate the line it sits on.
- **Your own footage beats everything.** An afternoon filming the workspace, the screen, the
  people and the real work will do more for a video than any graphic.
- **Stock is allowed** and is often the right answer for ordinary shots: hands at a
  keyboard, a room, a street.
- **Generate only what stock and code cannot produce.** A mascot animated from its own
  concept art is worth generating, because it exists nowhere else. A person typing at a
  laptop is not, because stock has it and generating it spends the budget on something
  ordinary. Realistic generated people or places need the platform's altered-content
  disclosure; drawn characters and abstract motion do not.
- **Centre a generated clip and fill the frame.** A small character in an empty frame wastes
  the insert. Measure the alpha bounding box across frames, crop to it, and scale up.
- Give stills motion: a slow push of 4 to 6 per cent, and a drifting texture behind them.
- Return to the face for honesty, humour, personal lines and the close.
- Never cover more than about 70 per cent of the face, and show one hero graphic at a time.
- If a bought motion-graphics library is available, nothing in it is required. Any single
  clip at most twice in a video, any one pack three or four times, never the same asset
  twice running.

## Sound

- Speech at −14 LUFS with true peak at or below −1 dB.
- Light processing: high-pass, gentle noise reduction, de-ess, mild compression, limiter.
  Over-processing is the larger risk. Heavy denoise leaves a watery edge on consonants that
  no viewer can name and every viewer hears.
- Room tone runs continuously because every segment carries it. Put cards over real tone,
  never digital silence.
- Sound effects follow the preset. Quiet and functional: a sound marks a change and is
  otherwise absent, about 12 to 20 dB under speech. Vary them; no single sound more than
  three or four times in a video.
- Music is a per-video setting. Under b-roll and montage it carries pace; under speech it
  fights the voice.

## Picture

- Convert whatever the camera produced to BT.709 at ingest. HDR footage looks flat or blown
  out otherwise, and the problem is invisible until someone watches on a different screen.
- A light grade on the footage only, never on the graphics. Shipping the grade as a LUT at
  partial strength makes it reusable and adjustable by one number.
- Do not stabilise handheld talking-head footage aggressively; the background warps.

## Recording advice worth giving

The cheapest improvements happen before the edit. Give these at handover, every time.

1. Look at the lens for a beat before speaking and hold it for a beat after the last word.
   This alone removes the look-away problem.
2. Use a teleprompter near the lens, and record in paragraphs rather than line by line.
   Line-by-line recording is what forces a cut every sentence.
3. Clip the microphone on rather than holding it.
4. Keep bright lights off the lens axis to avoid flare, and face the window.
5. Leave room in the frame: space beside the speaker is where graphics go.
6. Record 20 to 30 seconds of room tone, and mark a retake with a fixed spoken phrase.
7. Shoot at a higher resolution than delivery if the machine allows, so punch-ins cost
   nothing.
