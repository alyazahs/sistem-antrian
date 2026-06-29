def fetch_pengunjung_by_id(conn, pengunjung_id):
    return conn.execute(
        "SELECT * FROM pengunjung WHERE id=?",
        (pengunjung_id,),
    ).fetchone()

def build_pengunjung_updates(current, incoming, fallback=None):
    updates = {}

    for field in ("rfid_uid", "nik"):
        value = incoming.get(field)
        if value and current[field] != value:
            updates[field] = value

    for field in ("nama", "nohp", "tanggal_lahir", "alamat"):
        value = incoming.get(field)
        if value:
            updates[field] = value
        elif fallback and not current[field] and fallback[field]:
            updates[field] = fallback[field]

    return updates

def update_pengunjung_from_input(conn, current, incoming, fallback=None):
    updates = build_pengunjung_updates(current, incoming, fallback)
    if not updates:
        return current

    fields = ", ".join(f"{field}=?" for field in updates)
    params = list(updates.values())
    params.append(current["id"])

    conn.execute(
        f"UPDATE pengunjung SET {fields} WHERE id=?",
        params,
    )

    return fetch_pengunjung_by_id(conn, current["id"])

def merge_pengunjung_records(conn, target, duplicate, incoming):
    target_id = target["id"]
    duplicate_id = duplicate["id"]
    fallback = None

    if target_id != duplicate_id:
        fallback = duplicate
        conn.execute(
            "UPDATE antrian SET pengunjung_id=? WHERE pengunjung_id=?",
            (target_id, duplicate_id),
        )
        conn.execute("DELETE FROM pengunjung WHERE id=?", (duplicate_id,))
        target = fetch_pengunjung_by_id(conn, target_id)

    return update_pengunjung_from_input(conn, target, incoming, fallback)