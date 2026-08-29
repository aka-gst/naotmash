from PIL import Image, ImageDraw
from pathlib import Path
import random

OUT=Path(__file__).resolve().parents[1]/"ground"
OUT.mkdir(exist_ok=True)
specs={
"ground-yard.png":("#12160f","#33402a","stones"),
"ground-ice.png":("#0c131a","#2b4d61","cracks"),
"ground-hall.png":("#15100c","#4a3220","slabs"),
"ground-ash.png":("#121110","#3b332c","ash"),
}
def rgb(h): h=h.lstrip("#"); return tuple(int(h[i:i+2],16) for i in (0,2,4))
for idx,(name,(lo,hi,kind)) in enumerate(specs.items()):
    random.seed(9000+idx)
    a,b=rgb(lo),rgb(hi)
    # low-contrast base around dark end; brightness spread deliberately restrained
    base=tuple(int(a[i]*.72+b[i]*.28) for i in range(3))
    im=Image.new("RGB",(256,256),base); d=ImageDraw.Draw(im)
    if kind in ("stones","ash"):
        for _ in range(95):
            x=random.randrange(1,255); y=random.randrange(1,255); r=random.choice([1,1,2,3])
            delta=random.choice([-10,-7,6,9])
            c=tuple(max(0,min(255,v+delta)) for v in base)
            d.ellipse((x-r,y-r,x+r,y+r),fill=c)
    elif kind=="cracks":
        c=tuple(max(0,v-10) for v in base)
        for _ in range(18):
            x=random.randrange(10,246); y=random.randrange(10,246)
            pts=[(x,y)]
            for j in range(4):
                x+=random.randint(-12,12); y+=random.randint(4,14); pts.append((x%256,y%256))
            d.line(pts,fill=c,width=1)
    else:
        c=tuple(max(0,v-9) for v in base)
        for x in range(0,256,64): d.line((x,0,x,255),fill=c,width=2)
        for y in range(0,256,48): d.line((0,y,255,y),fill=c,width=2)
    # force exact opposite edges equal => programmatically seamless edge check
    px=im.load()
    for y in range(256): px[255,y]=px[0,y]
    for x in range(256): px[x,255]=px[x,0]
    im.save(OUT/name,"PNG",optimize=True)
