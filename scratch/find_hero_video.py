with open(r'c:\win-renewal\index_flux.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Find occurrences of hero-bg-video in HTML markup (not CSS)
pos = 0
while True:
    idx = text.find('hero-bg-video', pos)
    if idx == -1:
        break
    print(f"Found at {idx}")
    print(text[max(0, idx-200):min(len(text), idx+300)])
    print("="*50)
    pos = idx + 13
