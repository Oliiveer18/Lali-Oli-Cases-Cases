from PIL import Image, ImageDraw, ImageFilter, ImageChops
import math, random
N=1024
def grad():
    im=Image.new('RGB',(N,N)); px=im.load()
    top=(24,14,48); bot=(120,58,120)
    for y in range(N):
        t=y/(N-1); t=t**1.3
        c=tuple(int(top[i]+(bot[i]-top[i])*t) for i in range(3))
        for x in range(N): px[x,y]=c
    return im
bg=grad().convert('RGBA')
d=ImageDraw.Draw(bg)
# resplandor central
glow=Image.new('RGBA',(N,N),(0,0,0,0)); g=ImageDraw.Draw(glow)
g.ellipse((200,260,880,940),fill=(255,190,120,70))
glow=glow.filter(ImageFilter.GaussianBlur(90)); bg=Image.alpha_composite(bg,glow)
# estrellas
random.seed(4); d=ImageDraw.Draw(bg)
for _ in range(34):
    x,y=random.randint(30,N-30),random.randint(30,430); r=random.choice([3,4,6])
    d.ellipse((x-r,y-r,x+r,y+r),fill=(255,244,220,random.randint(110,230)))
# luna creciente
m=Image.new('L',(N,N),0); md=ImageDraw.Draw(m); md.ellipse((780,70,930,220),fill=255); md.ellipse((825,45,975,195),fill=0)
moon=Image.new('RGBA',(N,N),(255,243,196,255)); moon.putalpha(m); bg=Image.alpha_composite(bg,moon); d=ImageDraw.Draw(bg)
bg=bg.convert('RGBA')

fg=Image.new('RGBA',(N,N),(0,0,0,0)); f=ImageDraw.Draw(fg)
CREAM=(255,244,220,255); GOLD=(255,212,90,255); GOLD2=(201,160,0,255); INK=(42,27,48,255)
# L
f.rounded_rectangle((150,330,290,790),radius=26,fill=CREAM)
f.rounded_rectangle((150,670,450,790),radius=26,fill=CREAM)
f.rectangle((170,700,440,712),fill=(234,215,174,255))  # sombra interior
f.rounded_rectangle((150,670,450,790),radius=26,outline=None,fill=CREAM)
f.rounded_rectangle((150,330,290,790),radius=26,fill=CREAM)
f.rectangle((255,345,275,660),fill=(234,215,174,255))
# mango de la lupa (madera)
ang=math.radians(45); cx,cy,R=640,600,200
hx0,hy0=cx+(R-6)*math.cos(ang),cy+(R-6)*math.sin(ang)
hx1,hy1=cx+(R+250)*math.cos(ang),cy+(R+250)*math.sin(ang)
f.line((hx0,hy0,hx1,hy1),fill=(122,74,43,255),width=82)
f.line((hx0+14,hy0-14,hx1+14,hy1-14),fill=(168,116,69,255),width=22)
f.ellipse((hx1-41,hy1-41,hx1+41,hy1+41),fill=(122,74,43,255))
# virola dorada
vx,vy=cx+(R+40)*math.cos(ang),cy+(R+40)*math.sin(ang)
f.ellipse((vx-48,vy-48,vx+48,vy+48),fill=GOLD2)
# O = lente: aro dorado + cristal
f.ellipse((cx-R,cy-R,cx+R,cy+R),fill=GOLD2)
f.ellipse((cx-R+14,cy-R+14,cx+R-14,cy+R-14),fill=GOLD)
f.ellipse((cx-R+62,cy-R+62,cx+R-62,cy+R-62),fill=GOLD2)
f.ellipse((cx-R+74,cy-R+74,cx+R-74,cy+R-74),fill=(190,236,246,255))
# brillo del cristal
f.arc((cx-R+100,cy-R+100,cx+R-100,cy+R-100),200,265,fill=(255,255,255,255),width=26)
f.ellipse((cx+40,cy+30,cx+66,cy+56),fill=(255,255,255,200))
# sombrero fedora (capa propia, rotada)
hat=Image.new('RGBA',(N,N),(0,0,0,0)); h=ImageDraw.Draw(hat)
hc=(cx,370)
h.ellipse((hc[0]-235,hc[1]-6,hc[0]+235,hc[1]+78),fill=(93,57,32,255))             # ala sombra
h.ellipse((hc[0]-235,hc[1]-22,hc[0]+235,hc[1]+60),fill=(143,92,51,255))           # ala
h.rounded_rectangle((hc[0]-128,hc[1]-190,hc[0]+128,hc[1]+10),radius=70,fill=(122,74,43,255))  # copa
h.polygon([(hc[0]-30,hc[1]-186),(hc[0]+30,hc[1]-186),(hc[0]+10,hc[1]-120),(hc[0]-10,hc[1]-120)],fill=(95,56,30,255)) # hendidura
h.rectangle((hc[0]-128,hc[1]-62,hc[0]+128,hc[1]-8),fill=(217,74,63,255))          # cinta
h.rectangle((hc[0]-128,hc[1]-20,hc[0]+128,hc[1]-8),fill=(168,50,47,255))
h.ellipse((hc[0]-235,hc[1]-22,hc[0]+235,hc[1]+60),outline=(93,57,32,255),width=8)
hat=hat.rotate(9,center=(cx,hc[1]),resample=Image.BICUBIC)
fg=Image.alpha_composite(fg,hat)

# contorno oscuro grueso (estilo del juego) + sombra
a=fg.split()[3]
out=a.filter(ImageFilter.MaxFilter(25))
outline=Image.new('RGBA',(N,N),INK); outline.putalpha(out)
sh=Image.new('RGBA',(N,N),(0,0,0,140)); sh.putalpha(out.filter(ImageFilter.GaussianBlur(18)))
canvas=Image.new('RGBA',(N,N),(0,0,0,0)); canvas.paste(sh,(16,24),sh)
bg=Image.alpha_composite(bg,canvas)
bg=Image.alpha_composite(bg,outline)
bg=Image.alpha_composite(bg,fg)
# destellos
sp=Image.new('RGBA',(N,N),(0,0,0,0)); s=ImageDraw.Draw(sp)
def star(x,y,r):
    s.polygon([(x,y-r),(x+r*.22,y-r*.22),(x+r,y),(x+r*.22,y+r*.22),(x,y+r),(x-r*.22,y+r*.22),(x-r,y),(x-r*.22,y-r*.22)],fill=(255,255,255,255))
star(330,215,58); star(900,520,42); star(110,200,34)
bg=Image.alpha_composite(bg,sp)
img=bg.convert('RGB')
img.save('icon1024.png')
img.resize((180,180),Image.LANCZOS).save('apple-touch-icon.png',optimize=True)
img.resize((512,512),Image.LANCZOS).save('icon512.png',optimize=True)
