"""Tighten every segment to the frames where the speaker faces the camera.

Walk inward from each edge over the run of turned-away frames that touches it, and stop.
Only a run touching the edge is removed: a glance in the middle of a sentence is part of
how someone talks, and cutting there would cut the line in half.

Then build the edit again — build_edit.py picks this file up and applies it, while
refusing to cut more than three frames into sounding speech.

Usage: python3 scripts/gaze_trim.py [on_axis_degrees]
"""
import json, sys
from config import FPS, edit, islands

ON = float(sys.argv[1]) if len(sys.argv) > 1 else 8.0   # yaw above this is turned away
LEAD_OUT = 4   # the eyes leave before the head does: end before the turn starts
LEAD_IN = 2

G = {int(k): v[0] for k, v in json.load(open('work/gaze.json')).items() if v and v[0] is not None}
E, I = edit(), islands()

res, rows = {}, []
for s in E['segments']:
    if s.get('tone'):
        continue
    a, b = s['source_start_frame'], s['source_end_frame']
    mid = (a + b) // 2
    sp_a = round(I[s['islands'][0]]['s'] * FPS)    # where sound actually starts
    sp_b = round(I[s['islands'][1]]['e'] * FPS)    # and ends

    new_a = a
    while new_a in G and G[new_a] > ON and new_a < mid:
        new_a += 1
    if new_a > a:
        new_a += LEAD_IN

    new_b = b
    while (new_b - 1) in G and G[new_b - 1] > ON and new_b > mid:
        new_b -= 1
    if new_b < b or (new_b - 1 in G and new_b in G and G[new_b] > ON):
        new_b -= LEAD_OUT

    res[str(s['islands'][0])] = {'start': new_a, 'end': new_b}
    rows.append((s['id'], new_a - a, b - new_b,
                 max(0, new_a - sp_a), max(0, sp_b - new_b), s['text'][:48]))

json.dump(res, open('work/gaze_trim.json', 'w'), indent=0)
print('seg   in   out | speech clipped in/out (frames)')
for r in rows:
    print(f'{r[0]:4} {r[1]:4} {r[2]:5} | {r[3]:3} {r[4]:3}  {r[5]}')
clipped = sum(1 for r in rows if r[3] > 1 or r[4] > 1)
print(f'\n{sum(r[1] + r[2] for r in rows) / FPS:.1f} s trimmed across {len(rows)} segments; '
      f'{clipped} would clip speech (build_edit.py caps those at 3 frames).')
print('Now run build_edit.py again.')
