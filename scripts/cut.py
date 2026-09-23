"""Cut the source in a single filter graph.

One graph, not one file per segment joined afterwards. Cutting to separate files and
concatenating them drifts the audio: each file rounds its own start to a frame boundary and
the errors accumulate, so by the end of a ten-minute video the voice is visibly behind the
mouth. Trimming inside one graph has no such seam, and the audio stays uncompressed
throughout so nothing is re-encoded twice.

Alternate segments are punched in, which gives a second framing to cut to. The zoom is 18
per cent: enough that it reads as a deliberate change of shot. A nudge of a few per cent
reads as an accident and is a well-known amateur tell.

Usage: python3 scripts/cut.py
"""
from config import FPS, W, H, edit, ff, bt709

E = edit()
S = E['segments']
Z = 1.18
cw, ch = int(W / Z) // 2 * 2, int(H / Z) // 2 * 2
cx, cy = (W - cw) // 2, int((H - ch) * 0.30)      # biased upward: a head sits high in frame

f = ['[0:v]split=%d%s' % (len(S), ''.join(f'[v{i}]' for i in range(len(S)))),
     '[0:a]asplit=%d%s' % (len(S), ''.join(f'[a{i}]' for i in range(len(S))))]

for i, s in enumerate(S):
    a, b = s['source_start_frame'], s['source_end_frame']
    d = (b - a) / FPS
    speaking = sum(1 for q in S[:i] if not q.get('tone'))
    zoom = (f',crop={cw}:{ch}:{cx}:{cy},scale={W}:{H}:flags=lanczos'
            if speaking % 2 and not s.get('tone') else '')
    fade = s.get('fade_out', 0.02)
    f.append(f'[v{i}]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS{zoom},setsar=1[vv{i}]')
    f.append(f'[a{i}]atrim=start={a / FPS:.6f}:end={b / FPS:.6f},asetpts=PTS-STARTPTS,'
             f'afade=t=in:d=0.015,afade=t=out:st={d - fade:.4f}:d={fade}[aa{i}]')

f.append(''.join(f'[vv{i}][aa{i}]' for i in range(len(S))) +
         f'concat=n={len(S)}:v=1:a=1[v][a]')
open('work/cut.filter', 'w').write(';\n'.join(f))

ff('-i', E['source'], '-/filter_complex', 'work/cut.filter', '-map', '[v]', '-map', '[a]',
   '-r', str(FPS), '-c:v', 'libx264', '-crf', '16', '-preset', 'faster',
   '-pix_fmt', 'yuv420p', *bt709(), '-c:a', 'pcm_s16le', 'work/cut.mov', quiet=False)
print(f"\nwork/cut.mov: {len(S)} segments, {E['output_frames'] / FPS / 60:.2f} min")
