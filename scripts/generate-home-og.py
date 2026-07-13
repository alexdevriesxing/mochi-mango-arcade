from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT=Path.cwd()
PUBLIC=ROOT/'public'
OUT=PUBLIC/'assets/images/og/home.jpg'
OUT.parent.mkdir(parents=True,exist_ok=True)
W,H=1200,630
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
regular='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

strip=Image.new('RGB',(W,1))
d=ImageDraw.Draw(strip)
for x in range(W):
    t=x/(W-1)
    d.point((x,0),fill=(round(45+135*t),round(25+8*t),round(90+70*t)))
canvas=strip.resize((W,H),Image.Resampling.BILINEAR).convert('RGBA')
art_path=PUBLIC/'assets/images/home_hero_main_characters.jpg'
if art_path.exists():
    art=Image.open(art_path).convert('RGBA')
    scale=max(580/art.width,630/art.height)
    art=art.resize((int(art.width*scale),int(art.height*scale)),Image.Resampling.LANCZOS)
    art=art.crop(((art.width-580)//2,(art.height-630)//2,(art.width+580)//2,(art.height+630)//2))
    mask=Image.new('L',(580,H),0)
    md=ImageDraw.Draw(mask)
    for x in range(580):md.line((x,0,x,H),fill=round(255*max(0,min(1,(x-40)/260))))
    art.putalpha(mask)
    canvas.alpha_composite(art,(620,0))

overlay=Image.new('RGBA',(W,H),(0,0,0,0))
od=ImageDraw.Draw(overlay)
od.rounded_rectangle((52,48,1148,582),radius=42,fill=(255,255,255,18),outline=(255,255,255,55),width=2)
canvas=Image.alpha_composite(canvas,overlay)
draw=ImageDraw.Draw(canvas)
draw.rounded_rectangle((88,82,410,132),radius=25,fill=(255,255,255,238))
draw.text((111,94),'MOCHI MANGO ARCADE',font=ImageFont.truetype(bold,27),fill=(63,36,109))
draw.text((88,190),'392 FREE',font=ImageFont.truetype(bold,72),fill='white',stroke_width=1,stroke_fill=(28,12,57))
draw.text((88,270),'BROWSER GAMES',font=ImageFont.truetype(bold,58),fill=(255,227,151),stroke_width=1,stroke_fill=(28,12,57))
draw.text((91,365),'Original characters. Campaign goals.\nNo download. No account required.',font=ImageFont.truetype(regular,29),fill=(255,255,255,235),spacing=12)
draw.rounded_rectangle((88,486,466,544),radius=29,fill=(255,255,255,240))
draw.text((120,499),'PLAY FREE ONLINE',font=ImageFont.truetype(bold,25),fill=(168,15,82))
draw.text((88,558),'mochimangoarcade.com',font=ImageFont.truetype(regular,25),fill=(255,255,255,220))
canvas.convert('RGB').save(OUT,'JPEG',quality=90,optimize=True,progressive=True)
print({'ok':True,'output':str(OUT)})
