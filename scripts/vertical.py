"""Render the same edit at 1080x1920 for phones.

The cut, the audio and every cue time are shared with the landscape master. Only the
framing and the graphics differ, which is the whole point: two aspects, one set of
decisions, no second edit to keep in step.

The footage is cropped to a centre square and set into the middle of the tall frame, so
nothing is upscaled and the speaker keeps the framing that was composed on the day. The
brand ground fills the strips above and below, and that is where the graphics live. The
alternative — filling the frame by blowing the footage up 78 per cent — throws away most of
the picture and softens the face, which is the first thing a viewer looks at.

Usage: vertical.py [stills|render]
"""
import json, os, sys
from config import (FPS, W, H, VW, VH, VID_X, VID_Y, VID_H, NAME, GRAPHICS_DIR, ROOT,
                    COLORS, slots, ff, bt709, run, write_brand)

S = slots()
mode = sys.argv[1] if len(sys.argv) > 1 else 'render'
os.makedirs('graphics-v', exist_ok=True)
write_brand()

for s in S:
    pf = f"{ROOT}/work/vprops-{s['id']}.json"
    open(pf, 'w').write(json.dumps({'kind': s['kind'], 'frames': s['frames'],
                                    'props': s['props']}))
    if mode == 'stills':
        fr = min(s['frames'] - 6, max(s['frames'] * 2 // 3, 40))
        run(['npx', 'remotion', 'still', 'src/vertical.tsx', 'Slot',
             f"{ROOT}/verify/vert-{s['id']}.png", f'--props={pf}', f'--frame={fr}',
             '--log=error'], cwd=GRAPHICS_DIR)
    else:
        # Every vertical slot is opaque where it draws: the strips carry the brand ground
        # and the middle stays transparent, so the footage square shows through underneath.
        run(['npx', 'remotion', 'render', 'src/vertical.tsx', 'Slot',
             f"{ROOT}/graphics-v/{s['id']}.mov", f'--props={pf}',
             '--codec=prores', '--prores-profile=4444', '--pixel-format=yuva444p10le',
             '--image-format=png', '--concurrency=2', '--timeout=120000', '--log=error'],
            cwd=GRAPHICS_DIR)
    print(f"{s['id']:16} {s['kind']:14} {s['start']:5d} +{s['frames']:4d}")

if mode == 'stills':
    raise SystemExit

cmd = ['-i', 'work/cut.mov', '-i', 'work/cut-final-sfx.wav']
for s in S:
    cmd += ['-i', f"graphics-v/{s['id']}.mov"]
clips = [s for s in S if s['props'].get('clip')]
for s in clips:
    cmd += ['-i', os.path.join(GRAPHICS_DIR, 'public', s['props']['clip'])]

ground = COLORS['ground'].replace('#', '0x')
f = [f'color=c={ground}:s={VW}x{VH}:r={FPS}[bg]',
     # the same light grade as the landscape master, so the two look like one video
     f'[0:v]crop={VW}:{VID_H}:{VID_X}:0,eq=contrast=1.06:saturation=1.08:gamma=0.98[sq]',
     f'[bg][sq]overlay=x=0:y={VID_Y}[base0]']

last = 'base0'
for k, s in enumerate(S):
    f.append(f"[{k + 2}:v]setpts=PTS-STARTPTS+{s['start'] / FPS:.6f}/TB[g{k}]")
    f.append(f"[{last}][g{k}]overlay=eof_action=pass:repeatlast=0:format=auto:"
             f"enable='between(n,{s['start']},{s['start'] + s['frames'] - 1})'[o{k}]")
    last = f'o{k}'
for j, s in enumerate(clips):
    idx = len(S) + 2 + j
    f.append(f"[{idx}:v]scale=-2:760,setpts=PTS-STARTPTS+{s['start'] / FPS:.6f}/TB[c{j}]")
    f.append(f"[{last}][c{j}]overlay=eof_action=pass:repeatlast=0:format=auto:"
             f"x=(W-w)/2:y={VID_Y + VID_H - 200}:"
             f"enable='between(n,{s['start']},{s['start'] + s['frames'] - 1})'[cc{j}]")
    last = f'cc{j}'
f.append(f'[{last}]format=yuv420p[v]')
open('work/vert.filter', 'w').write(';\n'.join(f))

out = f'out/{NAME}-9x16.mp4'
ff(*cmd, '-/filter_complex', 'work/vert.filter', '-map', '[v]', '-map', '1:a',
   '-r', str(FPS), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
   '-profile:v', 'high', '-pix_fmt', 'yuv420p', *bt709(),
   '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', out, quiet=False)
print(f'\n{out} written')
