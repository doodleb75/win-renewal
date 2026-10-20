import os
import win32com.client

ppt_path = r"c:\win-renewal\WINHUB_리뉴얼_combine_v2_압축수정.pptx"
out_dir = r"c:\win-renewal\scratch\previews"
os.makedirs(out_dir, exist_ok=True)

ppt_app = win32com.client.Dispatch("PowerPoint.Application")
# Open presentation (FileName, ReadOnly, Untitled, WithWindow)
presentation = ppt_app.Presentations.Open(ppt_path, True, False, False)

slides_to_export = [4, 10, 11, 12, 13, 14, 15, 16, 22]

for slide_num in slides_to_export:
    slide = presentation.Slides(slide_num)
    export_path = os.path.join(out_dir, f"slide_{slide_num}.png")
    slide.Export(export_path, "PNG", 1920, 1080)
    print(f"Exported slide {slide_num} to {export_path}")

presentation.Close()
ppt_app.Quit()
print("Done!")
