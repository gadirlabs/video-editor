"""Transcribe each stretch of speech on its own.

One audio file and one output file per stretch. Two things learned the hard way:

- Transcribing the stretches together, or asking for one combined output, puts the text
  back out of step with the stretch it came from. Separate files cannot drift.
- A vocabulary prompt gets *echoed* by whisper.cpp on a near-silent clip, so a stretch of
  breathing comes back as your glossary. The glossary is applied afterwards, as text
  replacement on the result, where it cannot invent anything.

Usage: transcribe.py
"""
import glob, json, os, re, shutil
from config import WHISPER_BIN, WHISPER_MODEL, CFG, ff, run, require

require(WHISPER_BIN, 'ffmpeg')
if not os.path.exists(WHISPER_MODEL):
    raise SystemExit(f'model not found: {WHISPER_MODEL}\n'
                     'download one with whisper.cpp\'s models/download-ggml-model.sh')

I = json.load(open('work/islands.json'))
shutil.rmtree('work/isl', ignore_errors=True)
os.makedirs('work/isl')

PAD = 0.2
for o in I:
    ff('-ss', f'{max(0, o["s"] - PAD):.3f}', '-i', 'work/audio16k.wav',
       '-t', f'{o["e"] - o["s"] + PAD * 2:.3f}', '-ac', '1', '-ar', '16000',
       f'work/isl/{o["i"]:04d}.wav')

run([WHISPER_BIN, '-m', WHISPER_MODEL, '-l', 'en', '-nt', '-np', '-otxt',
     *sorted(glob.glob('work/isl/*.wav'))])

# Correct the proper nouns. Speech recognition mangles them every time, and without this
# the company name is wrong in the captions and on screen.
fixes = [(re.compile(re.escape(h), re.I), g['correct'])
         for g in CFG.get('glossary', []) for h in g.get('heard_as', [])]

for o in I:
    p = f'work/isl/{o["i"]:04d}.wav.txt'
    t = open(p).read().strip() if os.path.exists(p) else ''
    for pat, correct in fixes:
        t = pat.sub(correct, t)
    o['text'] = ' '.join(t.split())

json.dump(I, open('work/islands.json', 'w'), indent=0)
for o in I:
    print(f'{o["i"]:4d} [{o["s"]:7.2f}-{o["e"]:7.2f}] {o["e"] - o["s"]:5.2f}s  {o["text"]}')
print(f'\n{len(I)} stretches transcribed')
