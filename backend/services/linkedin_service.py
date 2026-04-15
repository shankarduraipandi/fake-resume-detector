def verify_linkedin_profile(linkedin_url: str) -> dict:
    is_valid = bool(linkedin_url and "linkedin.com" in linkedin_url.lower())
    if not is_valid:
        return {
            "url": linkedin_url,
            "profileDetected": False,
            "connections": "0",
            "status": "not_found",
            "verified": False,
        }

    print(f"[LINKEDIN] Mock verification completed for {linkedin_url}")
    return {
        "url": linkedin_url,
        "profileDetected": True,
        "connections": "500+",
        "status": "verified",
        "verified": True,
        "profile_status": "active",
        "profileStatus": "active",
    }
