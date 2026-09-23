"""Mix interface sounds under the normalised speech, cued from the graphics.

Sound effects are not decoration and not a personality. A sound marks a change on screen
and is otherwise absent, 12 to 20 dB under the voice. The cues come from slots.json rather
than from a person placing them, so a sound cannot drift away from what it is marking.

Note `level=0` on the limiter. Without it, ffmpeg's alimiter applies automatic make-up gain
and the finished mix comes back about 1.5 dB hotter than the speech you just normalised.

Skipped entirely when project.json says "sfx": "none".

Usage: python3 scripts/sfx.py
"""
import os, shutil
from config import FPS, SFX_DIR, CFG, slots, ff

if CFG.get('sfx', 'sparse') == 'none':
    shutil.copy('work/cut-final.wav', 'work/cut-final-sfx.wav')
    raise SystemExit('sfx: none — speech copied through unchanged')

S = slots()
events = []
for s in S:
    t0 = s['start'] / FPS
    if s['kind'] in ('TitleCard', 'EndCard'):
        events.append((t0, 'swell'))
    elif not s.get('alpha', True) or s.get('split'):
        events.append((max(0, t0 - 0.07), 'whoosh'))   # early: the sound leads the picture
    else:
        events.append((t0, 'pop'))
    for it in s['props'].get('items', []) + s['props'].get('steps', []):
        events.append((t0 + it['at'] / FPS, 'tick'))

missing = {n for _, n in events if not os.path.exists(f'{SFX_DIR}/{n}.wav')}
if missing:
    raise SystemExit(f'missing sounds in {SFX_DIR}: {", ".join(sorted(missing))}')

# No one sound more than three or four times in a video, and never twice running: a pop
# on every single reveal is how an edit starts sounding like a slideshow.
counts = {}
for _, n in events:
    counts[n] = counts.get(n, 0) + 1
for n, c in sorted(counts.items()):
    print(f'{n:8} {c:3}' + ('   ← used a lot; vary it' if c > 6 else ''))

cmd = ['-i', 'work/cut-final.wav']
f = []
for i, (t, name) in enumerate(events):
    cmd += ['-i', f'{SFX_DIR}/{name}.wav']
    f.append(f'[{i + 1}:a]adelay={int(t * 1000)}|{int(t * 1000)}[s{i}]')
f.append('[0:a]' + ''.join(f'[s{i}]' for i in range(len(events))) +
         f'amix=inputs={len(events) + 1}:normalize=0:duration=first,'
         'alimiter=limit=0.84:level=0[a]')
open('work/sfx.filter', 'w').write(';\n'.join(f))

ff(*cmd, '-/filter_complex', 'work/sfx.filter', '-map', '[a]', '-ar', '48000',
   'work/cut-final-sfx.wav')
print(f'\n{len(events)} sound cues mixed')
