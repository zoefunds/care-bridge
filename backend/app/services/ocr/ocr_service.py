import io
import re
import fitz
import pytesseract
from PIL import Image


async def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    texts = []
    for page in doc:
        text = page.get_text()
        if text.strip():
            texts.append(text)
        else:
            pix = page.get_pixmap(dpi=200)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            texts.append(pytesseract.image_to_string(img, lang="eng"))
    return "\n".join(texts)


async def extract_text_from_image(file_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(file_bytes))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    return pytesseract.image_to_string(img, lang="eng")


def extract_lab_markers(text: str) -> list[dict]:
    markers = []
    pattern = re.compile(
        r"([A-Za-z][A-Za-z0-9\s\-\.]{1,40}?)\s*[:\|]?\s*"
        r"([<>]?\d+\.?\d*)\s*"
        r"([a-zA-Z/%μ]+)?\s*"
        r"(?:Ref(?:erence)?\s*Range?:?\s*([\d\.\-\s]+[a-zA-Z/%μ]*))?",
        re.MULTILINE,
    )
    for m in pattern.finditer(text):
        name = m.group(1).strip()
        if len(name) < 2 or len(name) > 50:
            continue
        markers.append({
            "name": name,
            "value": m.group(2),
            "unit": m.group(3) or "",
            "reference_range": m.group(4) or "",
        })
    return markers[:50]
