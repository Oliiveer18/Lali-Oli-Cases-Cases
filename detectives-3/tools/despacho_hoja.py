import json, sys
from PIL import Image
d = json.load(open(sys.argv[1])); K = d['K']; out = d['out']
W = 8 + sum((o.get('w', 16) * K + 8) for o in out); H = 16 * K + 24
im = Image.new('RGBA', (W, H), (60, 42, 90, 255)); x = 8
for o in out:
    if 'px' in o:
        s = Image.new('RGBA', (o['w'], o['h'])); s.putdata([tuple(o['px'][i:i+4]) for i in range(0, len(o['px']), 4)])
        s = s.resize((o['w'] * K, o['h'] * K), Image.NEAREST); im.alpha_composite(s, (x, 12)); x += o['w'] * K + 8
    else: x += 16 * K + 8
im.save(sys.argv[2])
