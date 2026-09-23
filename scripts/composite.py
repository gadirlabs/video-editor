"""Composite the graphics over the cut and encode the landscape master.

Two flags carry the whole file. `eof_action=pass` lets the rest of the video continue after
a short overlay ends, instead of stopping the stream there. `repeatlast=0` stops the
overlay's final frame being held for the remainder of the video — without it, one card sits
on screen until the end credits, which is the most common way a first composite fails.

Usage: python3 scripts/composite.py
"""
import os
from config import FPS, W, H, NAME, GRAPHICS_DIR, COLORS, slots, edit, ff, bt709

S = slots()
E = edit()
dark = COLORS['text'].replace('#', '0x')

cmd = ['-i', 'work/cut.mov', '-i', 'work/cut-final-sfx.wav']
for s in S:
    cmd += ['-i', f"graphics/{s['id']}.mov"]
clips = [s for s in S if s['props'].get('clip')]
for s in clips:
    cmd += ['-i', os.path.join(GRAPHICS_DIR, 'public', s['props']['clip'])]

f = ['[0:v]eq=contrast=1.06:saturation=1.08:gamma=0.98[base0]']

# Split screen: for those ranges only, slide the centre of the footage into the left half.
# The panel's own wipe covers the move, so it reads as the graphic pushing the shot aside.
sp = [s for s in S if s.get('split')]
if sp:
    enb = '+'.join(f"between(n,{s['start']},{s['start'] + s['frames'] - 1})" for s in sp)
    f += ['[base0]split[b1][b2]',
          f'[b2]crop={W // 2}:{H}:{W // 4}:0,pad={W}:{H}:0:0:color={dark}[half]',
          f"[b1][half]overlay=enable='{enb}'[base]"]
else:
    f.append('[base0]null[base]')

last = 'base'
for k, s in enumerate(S):
    f.append(f"[{k + 2}:v]setpts=PTS-STARTPTS+{s['start'] / FPS:.6f}/TB[g{k}]")
    f.append(f"[{last}][g{k}]overlay=eof_action=pass:repeatlast=0:format=auto:"
             f"enable='between(n,{s['start']},{s['start'] + s['frames'] - 1})'[o{k}]")
    last = f'o{k}'

# Generated clips are keyed here rather than in the graphics renderer: Chrome drops WebM
# alpha, and ProRes 4444 alpha does not survive the browser either. ffmpeg keys it fine.
for j, s in enumerate(clips):
    idx = len(S) + 2 + j
    f.append(f"[{idx}:v]scale=-2:{int(H * 0.77)},setpts=PTS-STARTPTS+{s['start'] / FPS:.6f}/TB[c{j}]")
    f.append(f"[{last}][c{j}]overlay=eof_action=pass:repeatlast=0:format=auto:"
             f"x=W*0.62-w/2:y=(H-h)/2+30:"
             f"enable='between(n,{s['start']},{s['start'] + s['frames'] - 1})'[cc{j}]")
    last = f'cc{j}'

f.append(f'[{last}]format=yuv420p[v]')
open('work/comp.filter', 'w').write(';\n'.join(f))

out = f'out/{NAME}-16x9.mp4'
ff(*cmd, '-/filter_complex', 'work/comp.filter', '-map', '[v]', '-map', '1:a',
   '-r', str(FPS), '-c:v', 'libx264', '-crf', '17', '-preset', 'medium',
   '-profile:v', 'high', '-pix_fmt', 'yuv420p', *bt709(),
   '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', out, quiet=False)
print(f"\n{out}  {E['output_frames'] / FPS / 60:.2f} min")
