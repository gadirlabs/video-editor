"""Measure head pose on the frames around every cut.

Only needed when the speaker reads from notes beside the lens. It is the single biggest
quality difference this pipeline makes: without it, roughly two thirds of otherwise correct
takes begin or end on a glance towards a laptop, which reads as unprofessional even to a
viewer who could not say why.

Writes work/gaze.json: {source_frame: [yaw, pitch]} in degrees, and only for the frames near
a cut, because measuring the whole recording costs many times more for nothing.

macOS only: this uses Apple's Vision framework, which needs no model download and no
network. On Linux or Windows, substitute MediaPipe Face Mesh and write the same file.

Usage: uv run --with pyobjc-framework-Vision python scripts/gaze.py
"""
import glob, json, math, os, shutil
from config import FPS, edit, ff
import Vision
from Foundation import NSURL

E = edit()
windows = []
for s in E['segments']:
    if s.get('tone'):
        continue
    a, b = s['source_start_frame'], s['source_end_frame']
    mid = (a + b) // 2
    # only the frames a cut could land on: a little before the in point, a little after the out
    windows += [(a - 6, min(a + 36, mid)), (max(b - 45, mid), b + 6)]

out = json.load(open('work/gaze.json')) if os.path.exists('work/gaze.json') else {}


def pose(path):
    h = Vision.VNImageRequestHandler.alloc().initWithURL_options_(
        NSURL.fileURLWithPath_(path), None)
    r = Vision.VNDetectFaceRectanglesRequest.alloc().init()
    h.performRequests_error_([r], None)
    res = r.results()
    if not res:
        return None
    face = max(res, key=lambda x: x.boundingBox().size.width)   # the speaker, not a poster
    deg = lambda v: round(math.degrees(float(v)), 1) if v is not None else None
    return [deg(face.yaw()), deg(face.pitch())]


for a, b in windows:
    if all(str(n) in out for n in range(a, b)):
        continue
    shutil.rmtree('work/gz', ignore_errors=True)
    os.makedirs('work/gz')
    ff('-ss', f'{a / FPS:.4f}', '-i', 'work/source.mov', '-frames:v', str(b - a),
       '-vf', 'scale=960:-1', '-q:v', '3', 'work/gz/%04d.jpg')
    for i, p in enumerate(sorted(glob.glob('work/gz/*.jpg'))):
        out[str(a + i)] = pose(p)

json.dump(out, open('work/gaze.json', 'w'))
faces = [v for v in out.values() if v and v[0] is not None]
if faces:
    yaws = sorted(v[0] for v in faces)
    print(f'{len(out)} frames measured, {len(out) - len(faces)} without a face.')
    print(f'yaw median {yaws[len(yaws) // 2]:.1f}°, '
          f'10th–90th {yaws[len(yaws) // 10]:.1f}° to {yaws[len(yaws) * 9 // 10]:.1f}°')
    print('The baseline is this recording\'s own median: set ON in gaze_trim.py from it.')
