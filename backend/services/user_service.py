from sqlalchemy import or_

from database import db
from models import User
from utils.helpers import normalize_blank, normalize_phone


def upsert_user_from_extracted_data(extracted_data: dict) -> User | None:
    name = normalize_blank(extracted_data.get("name"))
    email = normalize_blank(extracted_data.get("email"))
    phone = normalize_phone(extracted_data.get("phone"))

    if not email and not phone:
        return None

    query_filters = []
    if email:
        query_filters.append(User.email == email)
    if phone:
        query_filters.append(User.phone == phone)

    user = User.query.filter(or_(*query_filters)).first() if query_filters else None

    if not user:
        user = User(name=name, email=email, phone=phone)
        db.session.add(user)
    else:
        if name:
            user.name = name
        if email:
            user.email = email
        if phone:
            user.phone = phone

    db.session.flush()
    return user
