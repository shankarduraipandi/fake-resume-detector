import json
import re
from pathlib import Path

import requests
from flask import current_app

from utils.helpers import extract_json_block, normalize_blank, normalize_phone, title_from_filename


KNOWN_SKILLS = [
    "Python",
    "Flask",
    "Django",
    "FastAPI",
    "Java",
    "Spring Boot",
    "C++",
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Express",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "AWS",
    "Azure",
    "Docker",
    "Kubernetes",
    "Git",
    "GitHub",
    "Machine Learning",
    "Data Analysis",
    "Pandas",
    "NumPy",
    "TensorFlow",
    "PyTorch",
    "REST API",
    "HTML",
    "CSS",
]


def extract_resume_data(resume_text: str, file_path: str) -> dict:
    if resume_text and current_app.config.get("GEMINI_API_KEY"):
        try:
            prompt = f"""
You are helping a college project backend extract resume details.
Return only valid JSON with these exact keys:
name, email, phone, skills, experience, education, location

Rules:
- skills must be an array of strings
- if a value is missing, use "Not mentioned"
- do not add extra keys

Resume text:
{resume_text[:12000]}
"""
            raw_output = _call_gemini(prompt)
            parsed = _normalize_extracted_data(_load_json(raw_output), file_path, resume_text)
            print("[GEMINI] Resume extraction completed using Gemini.")
            return parsed
        except Exception as error:
            print(f"[GEMINI] Extraction failed, using fallback data. Error: {error}")

    print("[GEMINI] Using fallback extracted data.")
    return _fallback_extracted_data(resume_text, file_path)


def validate_resume_consistency(extracted_data: dict) -> dict:
    if extracted_data and current_app.config.get("GEMINI_API_KEY"):
        try:
            prompt = f"""
You are validating resume consistency for a college project.
Return only valid JSON with:
consistent: boolean
reason: string

Resume data:
{json.dumps(extracted_data, indent=2)}
"""
            raw_output = _call_gemini(prompt)
            parsed = _load_json(raw_output)
            consistent = bool(parsed.get("consistent"))
            reason = parsed.get("reason") or "Gemini validation completed."
            return {"consistent": consistent, "reason": reason}
        except Exception as error:
            print(f"[GEMINI] Consistency validation failed, using fallback logic. Error: {error}")

    present_fields = 0
    for key in ["name", "email", "phone", "experience", "education", "location"]:
        if normalize_blank(extracted_data.get(key)):
            present_fields += 1

    skills = extracted_data.get("skills") or []
    valid_email = bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", str(extracted_data.get("email", "")).strip()))
    valid_phone = bool(re.sub(r"\D", "", str(extracted_data.get("phone", ""))))
    consistent = present_fields >= 4 and len(skills) >= 2 and (valid_email or valid_phone)

    if consistent:
        reason = "Candidate details look internally consistent based on extracted fields."
    else:
        reason = "Resume data is incomplete or inconsistent, so confidence is lower."

    return {"consistent": consistent, "reason": reason}


def suggest_job_roles(skills: list[str]) -> list[str]:
    clean_skills = [str(skill).strip() for skill in skills if str(skill).strip()]
    if not clean_skills:
        return [
            "Software Engineer",
            "Backend Developer",
            "Full Stack Developer",
            "QA Analyst",
            "Technical Support Engineer",
        ]

    if current_app.config.get("GEMINI_API_KEY"):
        try:
            prompt = f"""
Suggest exactly 5 job roles for these skills.
Return only a JSON array of strings.

Skills:
{", ".join(clean_skills)}
"""
            raw_output = _call_gemini(prompt)
            parsed = _load_json(raw_output)
            if isinstance(parsed, list):
                jobs = [str(item).strip() for item in parsed if str(item).strip()]
                if jobs:
                    return jobs[:5]
        except Exception as error:
            print(f"[GEMINI] Job suggestion failed, using fallback roles. Error: {error}")

    role_map = [
        ("Python", "Python Backend Developer"),
        ("Flask", "Flask Developer"),
        ("Django", "Django Developer"),
        ("FastAPI", "API Developer"),
        ("React", "Frontend Developer"),
        ("Node.js", "Full Stack Developer"),
        ("AWS", "Cloud Engineer"),
        ("Docker", "DevOps Engineer"),
        ("Machine Learning", "Machine Learning Engineer"),
        ("Data Analysis", "Data Analyst"),
        ("SQL", "Database Developer"),
        ("GitHub", "Open Source Developer"),
    ]

    suggestions = []
    lower_skills = {skill.lower() for skill in clean_skills}
    for keyword, role in role_map:
        if keyword.lower() in lower_skills and role not in suggestions:
            suggestions.append(role)

    defaults = [
        "Software Engineer",
        "Backend Developer",
        "Full Stack Developer",
        "Application Developer",
        "Technical Consultant",
    ]
    for role in defaults:
        if role not in suggestions:
            suggestions.append(role)

    return suggestions[:5]


def _call_gemini(prompt: str) -> str:
    api_key = current_app.config.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing.")

    model = current_app.config.get("GEMINI_MODEL", "gemini-1.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "response_mime_type": "application/json",
        },
    }

    response = requests.post(url, params={"key": api_key}, json=payload, timeout=20)
    response.raise_for_status()
    data = response.json()

    candidates = data.get("candidates") or []
    if not candidates:
        raise ValueError("No Gemini response candidates found.")

    parts = candidates[0].get("content", {}).get("parts", [])
    text_chunks = [part.get("text", "") for part in parts if part.get("text")]
    if not text_chunks:
        raise ValueError("No text returned from Gemini.")

    return "".join(text_chunks)


def _load_json(raw_output: str):
    try:
        return json.loads(raw_output)
    except json.JSONDecodeError:
        json_text = extract_json_block(raw_output)
        return json.loads(json_text)


def _normalize_extracted_data(data: dict, file_path: str, resume_text: str) -> dict:
    email = _extract_email(resume_text) or normalize_blank(data.get("email")) or "Not mentioned"
    phone = _extract_phone(resume_text) or normalize_phone(data.get("phone")) or "Not mentioned"
    skills = data.get("skills")
    if not isinstance(skills, list):
        skills = _infer_skills(resume_text)
    skills = [str(skill).strip() for skill in skills if str(skill).strip()]
    if not skills:
        skills = _infer_skills(resume_text)

    return {
        "name": normalize_blank(data.get("name")) or _guess_name(resume_text, file_path),
        "email": email,
        "phone": phone,
        "skills": skills[:8],
        "experience": normalize_blank(data.get("experience")) or _guess_experience(resume_text),
        "education": normalize_blank(data.get("education")) or _guess_education(resume_text),
        "location": normalize_blank(data.get("location")) or _guess_location(resume_text),
    }


def _fallback_extracted_data(resume_text: str, file_path: str) -> dict:
    return {
        "name": _guess_name(resume_text, file_path),
        "email": _extract_email(resume_text) or "Not mentioned",
        "phone": _extract_phone(resume_text) or "Not mentioned",
        "skills": _infer_skills(resume_text),
        "experience": _guess_experience(resume_text),
        "education": _guess_education(resume_text),
        "location": _guess_location(resume_text),
    }


def _extract_email(text: str) -> str | None:
    match = re.search(r"([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})", text or "")
    return match.group(1) if match else None


def _extract_phone(text: str) -> str | None:
    match = re.search(r"(\+?\d[\d\s().-]{8,}\d)", text or "")
    if not match:
        return None
    return normalize_phone(match.group(1))


def _infer_skills(text: str) -> list[str]:
    text_lower = (text or "").lower()
    found = [skill for skill in KNOWN_SKILLS if skill.lower() in text_lower]
    if found:
        return found[:8]
    return ["Python", "SQL", "Communication", "Problem Solving", "Teamwork"]


def _guess_name(text: str, file_path: str) -> str:
    for line in (text or "").splitlines()[:10]:
        candidate = line.strip()
        if not candidate:
            continue
        lowered = candidate.lower()
        if any(word in lowered for word in ["resume", "curriculum", "vitae", "email", "phone"]):
            continue
        if re.fullmatch(r"[A-Za-z][A-Za-z .'-]{2,50}", candidate):
            return candidate.title()
    return title_from_filename(Path(file_path).name)


def _guess_experience(text: str) -> str:
    match = re.search(r"(\d+\+?\s*(?:years?|yrs?))", text or "", re.IGNORECASE)
    if match:
        return match.group(1)
    return "Not mentioned"


def _guess_education(text: str) -> str:
    keywords = [
        "b.tech",
        "bachelor",
        "master",
        "m.tech",
        "b.e",
        "mca",
        "mba",
        "phd",
        "bsc",
        "msc",
    ]
    for line in (text or "").splitlines():
        cleaned = line.strip()
        lowered = cleaned.lower()
        if cleaned and any(keyword in lowered for keyword in keywords):
            return cleaned
    return "Not mentioned"


def _guess_location(text: str) -> str:
    location_patterns = [
        r"\b(?:Bangalore|Bengaluru|Mumbai|Delhi|Chennai|Hyderabad|Pune|Kolkata|Noida|Gurgaon|Ahmedabad)\b",
        r"\b(?:New York|San Francisco|Seattle|Austin|Boston|Chicago|Los Angeles)\b",
    ]
    for pattern in location_patterns:
        match = re.search(pattern, text or "", re.IGNORECASE)
        if match:
            return match.group(0)
    return "Not mentioned"
