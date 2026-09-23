"""Measure the source, then produce one working copy everything downstream uses.

Assume nothing about the camera. Phone footage is routinely HDR, variable frame rate and
rotated, and each of those quietly breaks a later step: HDR grades flat or blown out, VFR
makes frame numbers lie, and rotation metadata is honoured by some filters and not others.

Usage: normalise.py raw/<file>
"""
import json, sys, os
from config import FPS, W, H, ff, run, bt709, require

require('ffmpeg', 'ffprobe')
src = sys.argv[1]

probe = json.loads(run(['ffprobe', '-v', 'error', '-print_format', 'json',
                        '-show_streams', '-show_format', src],
                       capture_output=True, text=True).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = next((s for s in probe['streams'] if s['codec_type'] == 'audio'), None)

rot = 0
for sd in v.get('side_data_list', []):
    if 'rotation' in sd:
        rot = int(sd['rotation'])
display = v.get('display_aspect_ratio', '?')
trc = v.get('color_transfer', 'unknown')
hdr = trc in ('smpte2084', 'arib-std-b67')
vfr = v.get('r_frame_rate') != v.get('avg_frame_rate')

print(f"{v['width']}x{v['height']} {display}  rotation {rot}  transfer {trc}"
      f"{'  HDR' if hdr else ''}{'  variable frame rate' if vfr else ''}")
print(f"frame rate {v.get('avg_frame_rate')}  duration {float(probe['format']['duration'])/60:.1f} min"
      f"  audio {a['sample_rate'] if a else 'NONE'} Hz")

free = os.statvfs('.').f_bavail * os.statvfs('.').f_frsize / 1e9
need = float(probe['format']['duration']) / 60 * 0.19
print(f"disk: {free:.0f} GB free, working copy needs about {need:.0f} GB")
if free < need * 1.5:
    raise SystemExit('not enough disk for the working copy')

# Rotation is baked in here rather than left as metadata, because the trim/crop filters
# downstream ignore it. -noautorotate then an explicit transpose keeps the two in step.
vf = []
if rot in (90, -270):
    vf.append('transpose=1')
elif rot in (-90, 270):
    vf.append('transpose=2')
elif abs(rot) == 180:
    vf += ['hflip', 'vflip']
if hdr:
    # Tone-map to BT.709. On Apple Silicon scale_vt does this on the GPU and is much faster;
    # zscale is the portable path and is what runs everywhere else.
    vf.append('zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,'
              'tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv')
vf.append('format=yuv420p')

ff('-noautorotate', '-i', src, '-vf', ','.join(vf),
   '-fps_mode', 'cfr', '-r', str(FPS),
   '-c:v', 'libx264', '-crf', '16', '-preset', 'faster', *bt709(),
   '-c:a', 'pcm_s16le', 'work/source.mov', quiet=False)

ff('-i', 'work/source.mov', '-vn', '-ac', '1', '-ar', '16000', 'work/audio16k.wav')
print('\nwork/source.mov and work/audio16k.wav written')
