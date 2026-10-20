with open(r'c:\win-renewal\index_flux.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('class="navbar"')
with open(r'c:\win-renewal\scratch\navbar_slice.txt', 'w', encoding='utf-8') as out:
    out.write(text[idx-50:idx+2500])
print('Saved navbar_slice!')
