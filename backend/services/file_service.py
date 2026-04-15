from pathlib import Path

from docx import Document
from pypdf import PdfReader


def extract_text_from_resume(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _extract_text_from_pdf(path)
    if suffix == ".docx":
        return _extract_text_from_docx(path)

    raise ValueError("Unsupported file type. Only PDF and DOCX are supported.")


def _extract_text_from_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    chunks = []
    for page in reader.pages:
        chunks.append(page.extract_text() or "")
    return "\n".join(chunks).strip()


def _extract_text_from_docx(path: Path) -> str:
    document = Document(str(path))
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    return "\n".join(paragraphs).strip()
