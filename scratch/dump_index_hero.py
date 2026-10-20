with open(r'c:\win-renewal\index_flux.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('content-wrap')
with open(r'c:\win-renewal\scratch\hero_slice.txt', 'w', encoding='utf-8') as out:
    out.write(text[idx-50:idx+4000])
print('Saved hero slice!')
