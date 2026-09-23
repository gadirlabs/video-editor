"""Check the finished master before anyone else sees it.

The checks are ordered by what they actually catch. The first one — transcribing the
finished video and reading it as a script — has found more real defects than all the others
put together, because it is the only check that hears what a viewer will hear. A repeated
word, a half sentence or a clipped final word means the cut is wrong, and none of those are
visible in a waveform or a frame count.

Usage: verify.py out/<file>.mp4 [--fast]
"""
import glob, json, os, re, shutil, subprocess, sys
from config import FPS, WHISPER_BIN, WHISPER_MODEL, CFG, edit, slots, ff, run

master = sys.argv[1]
fast = '--fast' in sys.argv
E, S = edit(), slots()
report, fails = [], 0


def check(name, ok, detail):
    global fails
    report.append(('PASS' if ok else 'FAIL', name, detail))
    if not ok:
        fails += 1
    print(f"{'pass' if ok else 'FAIL'}  {name}: {detail}")


# ── 1. numbers ──
p = json.loads(run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_streams',
                    '-show_format', master], capture_output=True, text=True).stdout)
v = next(s for s in p['streams'] if s['codec_type'] == 'video')
frames = int(v.get('nb_frames') or 0)
check('frame count', abs(frames - E['output_frames']) <= 2,
      f"{frames} rendered, {E['output_frames']} planned")

r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', master,
         '-af', 'ebur128=peak=true', '-f', 'null', '-'],
        capture_output=True, text=True).stderr
lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1])
peak = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
check('loudness', abs(lufs + 14) <= 1.0 and peak <= -1.0,
      f'{lufs} LUFS, true peak {peak} dBFS (target -14, at or below -1)')

# ── 2. the transcript of the finished cut, read as a script ──
if not fast:
    ff('-i', master, '-vn', '-ac', '1', '-ar', '16000', 'verify/master.wav')
    run([WHISPER_BIN, '-m', WHISPER_MODEL, '-l', 'en', '-nt', '-np', '-otxt',
         'verify/master.wav'])
    said = ' '.join(open('verify/master.wav.txt').read().split())
    open('verify/master-transcript.txt', 'w').write(said)

    words = re.findall(r"[a-z']+", said.lower())
    dupes = [words[i] for i in range(1, len(words))
             if words[i] == words[i - 1] and words[i] not in ('that', 'had', 'very')]
    check('no stuttered joins', not dupes,
          f"repeated words at a join: {', '.join(sorted(set(dupes)))}" if dupes else 'none')

    planned = ' '.join(s['text'] for s in E['segments'] if not s.get('tone'))
    pw, sw = len(planned.split()), len(words)
    check('transcript length matches the plan', abs(pw - sw) / max(pw, 1) < 0.08,
          f'{sw} words spoken, {pw} planned')
    print('\n  → read verify/master-transcript.txt end to end. A machine cannot tell you '
          'whether a sentence finished.')

# ── 3. frames around every slot: present when expected, gone afterwards ──
want = sorted({n for s in S for n in
               (s['start'] + 4, s['start'] + s['frames'] * 2 // 3,
                min(E['output_frames'] - 1, s['start'] + s['frames'] + 8))})
shutil.rmtree('verify/frames', ignore_errors=True)
os.makedirs('verify/frames')
# ffmpeg rejects a very long select expression, so ask in batches of 40
for bi in range(0, len(want), 40):
    sel = '+'.join(f'eq(n\\,{n})' for n in want[bi:bi + 40])
    ff('-i', master, '-vf', f"select='{sel}'", '-fps_mode', 'passthrough',
       '-q:v', '3', f'verify/frames/{bi // 40:02d}_%04d.jpg')
got = len(glob.glob('verify/frames/*.jpg'))
check('slot frames extracted', got == len(want), f'{got} of {len(want)}')
print('  → look at verify/frames/. A linter passing is not evidence that a card appeared.')

# ── 4. legibility at phone size ──
os.makedirs('verify/small', exist_ok=True)
for f in sorted(glob.glob('verify/frames/*.jpg'))[:12]:
    ff('-i', f, '-vf', 'scale=480:-1', f"verify/small/{os.path.basename(f)}")
print('  → read verify/small/ at 480 px. If you cannot, the viewer on a phone cannot.')

# ── 5. captions, if they exist ──
srt = 'publish/captions.srt'
if os.path.exists(srt):
    t = open(srt).read()
    stamps = re.findall(r'(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)', t)
    secs = [(int(a) * 3600 + int(b) * 60 + int(c) + int(d) / 1000,
             int(e) * 3600 + int(f_) * 60 + int(g) + int(h) / 1000)
            for a, b, c, d, e, f_, g, h in stamps]
    dur = E['output_frames'] / FPS
    check('captions monotonic and inside the video',
          all(s < e for s, e in secs) and
          all(secs[i][0] >= secs[i - 1][0] for i in range(1, len(secs))) and
          secs[-1][1] <= dur + 1,
          f'{len(secs)} cues, last ends {secs[-1][1]:.1f}s of {dur:.1f}s')
    names = [g['correct'] for g in CFG.get('glossary', [])]
    wrong = [h for g in CFG.get('glossary', []) for h in g.get('heard_as', [])
             if re.search(re.escape(h), t, re.I)]
    check('proper nouns spelled correctly in captions', not wrong,
          f"mis-spelled: {', '.join(wrong)}" if wrong else f"{len(names)} names checked")

json.dump([{'result': r, 'check': n, 'detail': d} for r, n, d in report],
          open('verify/report.json', 'w'), indent=1)
print(f"\n{len(report) - fails} of {len(report)} automatic checks passed.")
if fails:
    raise SystemExit('fix the failures before handing this over')
