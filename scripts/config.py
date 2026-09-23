"""Everything the other scripts need to know about this project.

Run the scripts from the project folder — the one holding project.json, raw/ and work/.
Nothing here is specific to a video; the choices all live in project.json.
"""
import json, os, shutil, subprocess, sys

ROOT = os.getcwd()
CFG = json.load(open('project.json'))

FPS = CFG.get('fps', 30)
W, H = (int(x) for x in CFG.get('resolution', '1920x1080').split('x'))
ASPECTS = CFG.get('aspects', ['16:9'])
NAME = CFG.get('name', 'video')

# Vertical: a centre square of the landscape cut, set into a 1080x1920 frame with
# brand-coloured strips above and below. Nothing is upscaled and the speaker keeps
# his or her framing, which is why the square is the same height as the source.
VW, VH = 1080, 1920
VID_H = H                       # the square is as tall as the source is: no upscaling
VID_X = (W - VW) // 2           # centre crop of the landscape frame
VID_Y = (VH - VID_H) // 2 - 48  # a little above centre: a face reads better high in frame

BRAND = CFG.get('brand', {})
COLORS = {
    'ground': BRAND.get('ground', '#F4F6F8'),
    'text': BRAND.get('text', '#141B24'),
    'accent': BRAND.get('accent', '#6D28D9'),
    'accent_on_dark': BRAND.get('accent_on_dark', '#A78BFA'),
    'muted': BRAND.get('muted', '#7A8694'),
    'line': BRAND.get('line', '#D6DCE3'),
}

# The Remotion project. It lives with the skill, not with the video, because one renderer
# serves every project — note that this is NOT the project's own graphics/ folder, which is
# where the rendered clips land.
SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GRAPHICS_DIR = os.path.expanduser(CFG.get('graphics_dir', os.path.join(SKILL_DIR, 'graphics')))
SFX_DIR = os.path.expanduser(CFG.get('sfx_dir', os.path.join(ROOT, 'assets', 'sfx')))
WHISPER_MODEL = os.path.expanduser(
    CFG.get('whisper_model', '~/.cache/whisper-cpp/ggml-large-v3-turbo.bin'))
WHISPER_BIN = CFG.get('whisper_bin', 'whisper-cli')

for d in ('work', 'out', 'verify', 'publish'):
    os.makedirs(os.path.join(ROOT, d), exist_ok=True)


def run(args, **kw):
    """subprocess.run that stops on failure and prints the command when it does."""
    try:
        return subprocess.run(args, check=True, **kw)
    except subprocess.CalledProcessError:
        print('\nfailed:', ' '.join(str(a) for a in args), file=sys.stderr)
        raise


def ff(*args, quiet=True):
    """ffmpeg with the flags we always want. ffmpeg 8 renamed two of them; these are the
    current spellings, so an older build needs -filter_complex_script and -vsync instead."""
    return run(['ffmpeg', '-v', 'error' if quiet else 'info', '-stats', '-y', *args])


def bt709():
    return ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709']


def require(*tools):
    missing = [t for t in tools if not shutil.which(t)]
    if missing:
        raise SystemExit(f"not installed: {', '.join(missing)}")


def write_brand():
    """Hand the brand to the graphics renderer.

    The components import ./brand.json rather than reaching into project.json, so the
    renderer stays a self-contained folder that can live anywhere.
    """
    b = dict(COLORS)
    b['fonts'] = BRAND.get('fonts', {'display': 'Inter', 'body': 'Georgia', 'mono': 'monospace'})
    b['files'] = BRAND.get('font_files', {})
    b['style'] = BRAND.get('style', '')
    d = os.path.join(GRAPHICS_DIR, 'src')
    if not os.path.isdir(d):
        raise SystemExit(f'no Remotion project at {GRAPHICS_DIR}\n'
                         'set graphics_dir in project.json, or run npm install in the '
                         "skill's graphics/ folder")
    p = os.path.join(d, 'brand.json')
    old = open(p).read() if os.path.exists(p) else ''
    new = json.dumps(b, indent=1)
    if old != new:                       # only touch it when it changed: Remotion re-bundles
        open(p, 'w').write(new)
    return b


def edit():
    return json.load(open('lesson.edit.json'))


def islands():
    return json.load(open('work/islands.json'))


def slots():
    return json.load(open('slots.json'))
