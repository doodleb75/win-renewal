with open(r'c:\win-renewal\index_flux.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('class="section_hero"')
if idx == -1:
    idx = text.find('section_hero')

with open(r'c:\win-renewal\scratch\hero_full_markup.txt', 'w', encoding='utf-8') as out:
    out.write(text[idx-200:idx+4500])
print('Saved section_hero markup!')
