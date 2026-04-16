import re
from pathlib import Path


PLACEHOLDER_VALUES = {
    "",
    "na",
    "n/a",
    "none",
    "unknown",
    "not available",
    "not mentioned",
}

DEFAULT_COUNTRY_CODE = "91"


def get_request_data(request):
    return request.get_json(silent=True) or request.form.to_dict() or {}


def pick_value(data: dict, *keys, default=None):
    for key in keys:
        if key in data and data.get(key) not in (None, ""):
            return data.get(key)
    return default


def to_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "y", "verified"}
    return False


def allowed_file(filename: str, allowed_extensions: set[str]) -> bool:
    if "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in allowed_extensions


def normalize_blank(value):
    if value is None:
        return None
    if not isinstance(value, str):
        return value

    cleaned = value.strip()
    if cleaned.lower() in PLACEHOLDER_VALUES:
        return None
    return cleaned


def normalize_phone(value):
    cleaned = normalize_blank(value)
    if not cleaned:
        return None

    digits_only = re.sub(r"\D", "", cleaned)
    if not digits_only:
        return None

    if digits_only.startswith("00"):
        digits_only = digits_only[2:]

    # Default local 10-digit numbers to India (+91).
    if len(digits_only) == 10:
        return f"+{DEFAULT_COUNTRY_CODE}{digits_only}"

    # Handle numbers written as 0XXXXXXXXXX.
    if len(digits_only) == 11 and digits_only.startswith("0"):
        return f"+{DEFAULT_COUNTRY_CODE}{digits_only[1:]}"

    # Preserve valid Indian numbers already carrying the country code.
    if len(digits_only) >= 12 and digits_only.startswith(DEFAULT_COUNTRY_CODE):
        return f"+{digits_only}"

    if cleaned.startswith("+"):
        return f"+{digits_only}"

    if len(digits_only) > 10:
        return f"+{digits_only}"

    return None


def title_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(r"[_-]+", " ", stem)
    stem = re.sub(r"\s+", " ", stem).strip()
    return stem.title() or "Unknown Candidate"


def extract_json_block(text: str) -> str:
    match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
    if not match:
        raise ValueError("Could not find JSON in model response.")
    return match.group(1)
