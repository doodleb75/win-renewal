with open(r'c:\win-renewal\index_flux.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = 43602
with open(r'c:\win-renewal\scratch\index_flux_hero_dom.txt', 'w', encoding='utf-8') as out:
    out.write(text[idx-1500:idx+2500])
print('Saved index_flux_hero_dom!')
