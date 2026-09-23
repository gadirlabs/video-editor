"""Plan, review and render the graphics.

The slot plan for a video lives in slots_plan.py beside project.json, and defines one
function:

    def build(st, en, slot, LEAD):
        return [
            slot('01-title', 'CornerTitle', st(0) + 4, en(0) - 2,
                 {'eyebrow': 'Series name', 'title': 'This episode'}),
            ...
        ]

`st(k)` and `en(k)` are the output frames of the segment that starts at speech stretch k.
**Anchor every cue to st()/en(), never to a typed frame number.** A typed number is correct
until the first re-cut and silently wrong after it, and a re-cut always happens.

This script then enforces what a person forgets: no two slots overlap, and no two
full-frame inserts run back to back. It reports coverage and the longest plain talking head
so pacing is a number rather than an impression.

Usage: graphics.py [plan|stills|render]
"""
import json, os, sys
from config import FPS, GRAPHICS_DIR, ROOT, edit, run, write_brand

sys.path.insert(0, ROOT)
from slots_plan import build   # noqa: E402

E = edit()
SEG = {s['islands'][0]: s for s in E['segments'] if not s.get('tone')}
st = lambda k: SEG[k]['output_start_frame']
en = lambda k: SEG[k]['output_end_frame']
LEAD = 8   # an insert starts a few frames before the words it illustrates


def slot(id, kind, start, end, props, full=False):
    """One graphic. `full` means it takes the whole frame; otherwise it sits over the shot.

    Text with no panel behind it is light on a dark halo, because the footage is bright.
    Full-frame inserts are the brand ground with dark text.
    """
    return {'id': id, 'kind': kind, 'start': start, 'frames': end - start,
            'alpha': not full, 'full': full, 'dark_overlay': not full, 'props': props}


S = build(st, en, slot, LEAD)
write_brand()

for a, b in zip(S, S[1:]):
    assert a['start'] + a['frames'] <= b['start'], f"overlap: {a['id']} → {b['id']}"
fulls = [s for s in S if s['full']]
for a, b in zip(fulls, fulls[1:]):
    gap = (b['start'] - (a['start'] + a['frames'])) / FPS
    assert gap > 0.6, f"full-frame inserts back to back: {a['id']} → {b['id']} ({gap:.2f}s)"

json.dump(S, open('slots.json', 'w'), indent=1)
mode = sys.argv[1] if len(sys.argv) > 1 else 'plan'

for s in S:
    pf = f"{ROOT}/work/props-{s['id']}.json"
    open(pf, 'w').write(json.dumps({'kind': s['kind'], 'frames': s['frames'],
                                    'darkOverlay': s['dark_overlay'], 'props': s['props']}))
    if mode == 'stills':
        # two thirds in, where a staged reveal has finished but nothing has faded yet
        fr = min(s['frames'] - 6, max(s['frames'] * 2 // 3, 40))
        run(['npx', 'remotion', 'still', 'src/landscape.tsx', 'Slot',
             f"{ROOT}/verify/{s['id']}.png", f'--props={pf}', f'--frame={fr}', '--log=error'],
            cwd=GRAPHICS_DIR)
    elif mode == 'render':
        alpha = ['--codec=prores', '--prores-profile=4444',
                 '--pixel-format=yuva444p10le', '--image-format=png']
        opaque = ['--codec=prores', '--prores-profile=hq', '--image-format=png']
        run(['npx', 'remotion', 'render', 'src/landscape.tsx', 'Slot',
             f"{ROOT}/graphics/{s['id']}.mov", f'--props={pf}',
             '--concurrency=2', '--timeout=120000', '--log=error'] +
            (alpha if s['alpha'] else opaque), cwd=GRAPHICS_DIR)
    print(f"{s['id']:16} {s['kind']:14} {s['start']:5d} +{s['frames']:4d} "
          f"{'FULL' if s['full'] else ''}")

# ── pacing, measured rather than felt ──
N = E['output_frames']
on = [0] * N
for s in S:
    for n in range(s['start'], min(N, s['start'] + s['frames'])):
        on[n] = 1
runs, cur = [], 0
for n in range(N + 1):
    if n < N and not on[n]:
        cur += 1
    else:
        if cur:
            runs.append(cur)
        cur = 0
kinds = {}
for s in S:
    kinds[s['kind']] = kinds.get(s['kind'], 0) + 1
overused = [k for k, c in kinds.items() if c > 3]

print(f"\ncoverage {sum(on) / N * 100:.0f}%   longest plain talking head "
      f"{max(runs) / FPS:.1f}s   {len(S)} slots, {len(fulls)} full-frame")
print(f"cuts per minute {len([s for s in E['segments'] if not s.get('tone')]) / (N / FPS / 60):.1f}"
      "  (under 8 for course, under 5 for vlog)")
if overused:
    print(f"same shape used more than three times: {', '.join(overused)} — replace some")
