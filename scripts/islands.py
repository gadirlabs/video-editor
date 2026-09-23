"""Find the stretches of speech, from the audio itself.

This is the step people skip, and skipping it is why most automated edits of retake-heavy
footage come out wrong. A whole-file transcript gives word timestamps that look usable and
are not: when a line is said four times, alignment smears across the attempts and a cut
placed on those timings lands inside the wrong take.

An energy envelope has no such opinion. It says only where sound is, which is all the cut
needs; the words come later, one stretch at a time.

Usage: islands.py [threshold_db]
"""
import json, sys, wave
import numpy as np
from config import FPS

MINGAP = 0.30   # two stretches closer than this are one stretch
MINLEN = 0.12   # shorter than this is a click, a breath or a chair

w = wave.open('work/audio16k.wav')
sr = w.getframerate()
a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
hop = int(sr * 0.01)
n = len(a) // hop
rms = np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
db = np.convolve(20 * np.log10(rms), np.ones(5) / 5, 'same')   # 50 ms smoothing
np.save('work/env_db.npy', db)

pc = {p: float(np.percentile(db, p)) for p in (5, 20, 50, 80, 95)}
print('level percentiles dB  ' + '  '.join(f'{p}:{v:.1f}' for p, v in pc.items()))

# Default threshold sits between the room and the voice. Pass one explicitly if the
# recording is noisy or very quiet — the percentiles above are the guide.
TH = float(sys.argv[1]) if len(sys.argv) > 1 else (pc[20] + pc[80]) / 2
print(f'threshold {TH:.1f} dB')

sp = db > TH
runs, i = [], 0
while i < len(sp):
    if sp[i]:
        j = i
        while j < len(sp) and sp[j]:
            j += 1
        runs.append([i * 0.01, j * 0.01])
        i = j
    else:
        i += 1

merged = []
for s, e in runs:
    if merged and s - merged[-1][1] < MINGAP:
        merged[-1][1] = e
    else:
        merged.append([s, e])
merged = [r for r in merged if r[1] - r[0] >= MINLEN]

out = [{'i': k, 's': round(s, 2), 'e': round(e, 2), 'text': ''} for k, (s, e) in enumerate(merged)]
json.dump(out, open('work/islands.json', 'w'), indent=0)
print(f'\n{len(out)} stretches of speech, {sum(o["e"] - o["s"] for o in out) / 60:.1f} min of sound')
