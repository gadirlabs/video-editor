"""Clean the speech lightly, then normalise to -14 LUFS in two passes.

Light is the operative word. Over-processing is a bigger risk than under-processing: heavy
noise reduction leaves a watery artefact around consonants that no viewer can name and
every viewer hears. The chain below is a high-pass, a gentle denoise, a de-esser, mild
compression and a limiter, and it is meant to be barely audible as a change.

Two passes for loudness because one pass is an estimate. The first measures the whole file,
the second applies the correction it found, which is the difference between arriving at
-14 LUFS and arriving near it.

Usage: python3 scripts/audio.py
"""
import json
from config import ff, run

CHAIN = ('highpass=f=80,'
         'afftdn=nr=8:nf=-42,'
         'deesser=i=0.3,'
         'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,'
         'alimiter=limit=0.89')

ff('-i', 'work/cut.mov', '-vn', '-af', CHAIN, '-ar', '48000', 'work/cut-clean.wav')

r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', 'work/cut-clean.wav',
         '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
        capture_output=True, text=True).stderr
m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])

ff('-i', 'work/cut-clean.wav', '-af',
   f'loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:'
   f'measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:'
   f'offset={m["target_offset"]}:linear=true',
   '-ar', '48000', 'work/cut-final.wav')

print(f'measured {m["input_i"]} LUFS, true peak {m["input_tp"]} dB → -14 LUFS')
