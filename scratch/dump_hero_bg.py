with open(r'c:\win-renewal\index_flux.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('hero-bg-video')
with open(r'c:\win-renewal\scratch\hero_bg_context.txt', 'w', encoding='utf-8') as out:
    out.write(text[idx-500:idx+1500])
print('Saved hero_bg_context!')
