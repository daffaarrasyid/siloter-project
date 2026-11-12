from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field

from app.core.supabase_client import get_supabase_client

logger = logging.getLogger("siloter.routes_users")

router = APIRouter(prefix="/api/users", tags=["Users"])


# ==============================================================================
# SCHEMAS
# ==============================================================================

class UserPersonnel(BaseModel):
    id: str
    full_name: str
    nip: str
    email: str
    role: str = Field(..., description="Admin Utama, Operator CCTV, Verifikator Tiket, Teknisi Lapangan")
    role_key: str = Field("operator", description="admin | operator | verifikator | teknisi")
    placement: str = Field(..., description="Penempatan / Titik Pantau")
    status: str = Field("Aktif", description="Aktif | Non-aktif")
    is_online: bool = Field(True)
    last_active: str
    phone: Optional[str] = None
    created_at: Optional[str] = None


class UserCreatePayload(BaseModel):
    full_name: str = Field(..., min_length=3)
    nip: str = Field(..., min_length=8)
    email: str
    role: str = Field(default="Operator CCTV")
    placement: str = Field(default="Pos Empang & Simpang BTM")
    status: str = Field(default="Aktif")
    phone: Optional[str] = None


class UserUpdatePayload(BaseModel):
    full_name: Optional[str] = None
    nip: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    placement: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None


class UserStatsResponse(BaseModel):
    total_personnel: int
    field_officers: int
    admins: int
    verifiers: int
    active_now: int


# ==============================================================================
# INITIAL SEED PERSONNEL DATA (MATCHING MOCKUP DISHUB BOGOR)
# ==============================================================================

DEFAULT_PERSONNEL: List[Dict[str, Any]] = [
    {
        "id": "usr-001",
        "full_name": "Budi Santoso, S.T.",
        "nip": "198205142006041002",
        "email": "budi.dishub@kotabogor.go.id",
        "role": "Admin Utama",
        "role_key": "admin",
        "placement": "Command Center Dishub",
        "status": "Aktif",
        "is_online": True,
        "last_active": "10 menit lalu",
        "phone": "0812-3456-7890",
        "created_at": "2024-01-15T08:00:00Z",
    },
    {
        "id": "usr-002",
        "full_name": "Hendra Santoso, A.Md.",
        "nip": "198903122011011005",
        "email": "hendra.cctv@kotabogor.go.id",
        "role": "Operator CCTV",
        "role_key": "operator",
        "placement": "Pos Empang & Simpang BTM",
        "status": "Aktif",
        "is_online": True,
        "last_active": "Hari ini, 08:30 WIB",
        "phone": "0813-8877-6655",
        "created_at": "2024-02-01T08:00:00Z",
    },
    {
        "id": "usr-003",
        "full_name": "Rahmat Hidayat",
        "nip": "199307222016021008",
        "email": "rahmat.ops@kotabogor.go.id",
        "role": "Verifikator Tiket",
        "role_key": "verifikator",
        "placement": "Unit Reaksi Cepat (URC)",
        "status": "Aktif",
        "is_online": True,
        "last_active": "Hari ini, 07:15 WIB",
        "phone": "0856-1122-3344",
        "created_at": "2024-03-10T08:00:00Z",
    },
    {
        "id": "usr-004",
        "full_name": "Siti Rahmawati, S.Tr.Tra",
        "nip": "199511042019032014",
        "email": "siti.rahma@kotabogor.go.id",
        "role": "Operator CCTV",
        "role_key": "operator",
        "placement": "Pos Suryakencana & Pasar Bogor",
        "status": "Aktif",
        "is_online": True,
        "last_active": "Kemarin, 16:45 WIB",
        "phone": "0878-9900-1122",
        "created_at": "2024-03-15T08:00:00Z",
    },
    {
        "id": "usr-005",
        "full_name": "Dedi Kurniawan",
        "nip": "198701192009011003",
        "email": "dedi.teknis@kotabogor.go.id",
        "role": "Teknisi Lapangan",
        "role_key": "teknisi",
        "placement": "Bidang Lalu Lintas",
        "status": "Non-aktif",
        "is_online": False,
        "last_active": "3 hari yang lalu",
        "phone": "0821-3344-5566",
        "created_at": "2024-01-20T08:00:00Z",
    },
    {
        "id": "usr-006",
        "full_name": "Ahmad Fauzi, A.Md.PKB",
        "nip": "199104082014021006",
        "email": "ahmad.fauzi@kotabogor.go.id",
        "role": "Verifikator Tiket",
        "role_key": "verifikator",
        "placement": "Terminal Baranangsiang",
        "status": "Aktif",
        "is_online": True,
        "last_active": "Hari ini, 09:12 WIB",
        "phone": "0812-9988-7766",
        "created_at": "2024-04-01T08:00:00Z",
    },
    {
        "id": "usr-007",
        "full_name": "Fajar Pratama, S.Si.",
        "nip": "199012052015031004",
        "email": "fajar.pratama@kotabogor.go.id",
        "role": "Admin Sistem",
        "role_key": "admin",
        "placement": "Pusat Data Dishub",
        "status": "Aktif",
        "is_online": True,
        "last_active": "5 menit lalu",
        "phone": "0852-4455-6677",
        "created_at": "2024-01-10T08:00:00Z",
    },
    {
        "id": "usr-008",
        "full_name": "Tri Wahyuni, S.Kom.",
        "nip": "199406182018012003",
        "email": "tri.wahyuni@kotabogor.go.id",
        "role": "Admin Sistem",
        "role_key": "admin",
        "placement": "Pusat Data Dishub",
        "status": "Aktif",
        "is_online": False,
        "last_active": "Kemarin, 18:20 WIB",
        "phone": "0819-3322-1100",
        "created_at": "2024-01-12T08:00:00Z",
    },
    {
        "id": "usr-009",
        "full_name": "Agus Setiawan",
        "nip": "198808202010011007",
        "email": "agus.setiawan@kotabogor.go.id",
        "role": "Operator CCTV",
        "role_key": "operator",
        "placement": "Pos Balaikota Bogor",
        "status": "Aktif",
        "is_online": True,
        "last_active": "Hari ini, 08:45 WIB",
        "phone": "0813-7766-5544",
        "created_at": "2024-02-15T08:00:00Z",
    },
    {
        "id": "usr-010",
        "full_name": "Nurul Hidayati",
        "nip": "199602142020022005",
        "email": "nurul.hidayati@kotabogor.go.id",
        "role": "Verifikator Tiket",
        "role_key": "verifikator",
        "placement": "Pos Simpang BTM",
        "status": "Aktif",
        "is_online": True,
        "last_active": "Hari ini, 09:30 WIB",
        "phone": "0877-6655-4433",
        "created_at": "2024-04-10T08:00:00Z",
    },
    {
        "id": "usr-011",
        "full_name": "Eko Prasetyo",
        "nip": "199203112017011009",
        "email": "eko.prasetyo@kotabogor.go.id",
        "role": "Operator CCTV",
        "role_key": "operator",
        "placement": "Pos Jembatan Merah",
        "status": "Aktif",
        "is_online": True,
        "last_active": "Hari ini, 07:50 WIB",
        "phone": "0812-1100-2233",
        "created_at": "2024-02-20T08:00:00Z",
    },
    {
        "id": "usr-012",
        "full_name": "Bambang Wijaya",
        "nip": "198605092008031002",
        "email": "bambang.wijaya@kotabogor.go.id",
        "role": "Teknisi Lapangan",
        "role_key": "teknisi",
        "placement": "Bidang Rekayasa Lalu Lintas",
        "status": "Aktif",
        "is_online": True,
        "last_active": "Hari ini, 08:10 WIB",
        "phone": "0857-2233-4455",
        "created_at": "2024-03-01T08:00:00Z",
    },
    {
        "id": "usr-013",
        "full_name": "Dewi Anggraini, S.E.",
        "nip": "199310152019022008",
        "email": "dewi.anggraini@kotabogor.go.id",
        "role": "Operator CCTV",
        "role_key": "operator",
        "placement": "Command Center Dishub",
        "status": "Aktif",
        "is_online": False,
        "last_active": "Kemarin, 21:00 WIB",
        "phone": "0818-4455-6677",
        "created_at": "2024-03-25T08:00:00Z",
    },
    {
        "id": "usr-014",
        "full_name": "Rizky Ramadhan",
        "nip": "199708252021011004",
        "email": "rizky.ramadhan@kotabogor.go.id",
        "role": "Operator CCTV",
        "role_key": "operator",
        "placement": "Unit Reaksi Cepat (URC)",
        "status": "Aktif",
        "is_online": True,
        "last_active": "Hari ini, 08:00 WIB",
        "phone": "0896-5566-7788",
        "created_at": "2024-05-01T08:00:00Z",
    },
]

# In-memory storage cache for personnel list
_personnel_store: List[Dict[str, Any]] = [dict(p) for p in DEFAULT_PERSONNEL]


# ==============================================================================
# ENDPOINTS
# ==============================================================================

@router.get("/stats", response_model=UserStatsResponse)
def get_user_stats() -> UserStatsResponse:
    """
    Returns aggregated KPI counts matching media_1794443330909_34870ca0.png:
    - Total Personel: 14 (Terdaftar di sistem)
    - Petugas Lapangan: 8 (Online)
    - Admin Sistem: 3 (Hak akses root & config)
    - Verifikator Ngetem: 3 (Validasi tilang elektronik)
    """
    total = len(_personnel_store)
    field_officers = sum(1 for p in _personnel_store if "Operator" in p["role"] or "Teknisi" in p["role"])
    admins = sum(1 for p in _personnel_store if "Admin" in p["role"])
    verifiers = sum(1 for p in _personnel_store if "Verifikator" in p["role"])
    active_now = sum(1 for p in _personnel_store if p.get("is_online", False))

    return UserStatsResponse(
        total_personnel=total,
        field_officers=field_officers,
        admins=admins,
        verifiers=verifiers,
        active_now=active_now,
    )


@router.get("", response_model=List[UserPersonnel])
def get_users(
    query: Optional[str] = Query(None, description="Search query by name, NIP, or email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Aktif / Non-aktif)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> List[UserPersonnel]:
    """
    Retrieves filtered and paginated list of Dishub personnel matching the mockup table.
    """
    results = []
    q_clean = query.strip().lower() if isinstance(query, str) and query else None
    role_clean = role.strip().lower() if isinstance(role, str) and role and role != "Semua Peran" else None
    status_clean = status_filter.strip().lower() if isinstance(status_filter, str) and status_filter and status_filter != "Semua Status" else None

    for p in _personnel_store:
        # Search filter
        if q_clean:
            match_name = q_clean in p["full_name"].lower()
            match_nip = q_clean in p["nip"].lower()
            match_email = q_clean in p["email"].lower()
            if not (match_name or match_nip or match_email):
                continue

        # Role filter
        if role_clean:
            p_role = p["role"].lower()
            if role_clean not in p_role and role_clean != p.get("role_key", "").lower():
                continue

        # Status filter
        if status_clean:
            if p["status"].lower() != status_clean:
                continue

        results.append(UserPersonnel(**p))

    _limit = limit if isinstance(limit, int) else 50
    _offset = offset if isinstance(offset, int) else 0
    return results[_offset : _offset + _limit]


@router.post("", response_model=UserPersonnel, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreatePayload) -> UserPersonnel:
    """
    Adds a new personnel to the roster.
    """
    # Check duplicate NIP or email
    for existing in _personnel_store:
        if existing["nip"] == payload.nip.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Pegawai dengan NIP {payload.nip} sudah terdaftar.",
            )
        if existing["email"].lower() == payload.email.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email {payload.email} sudah digunakan.",
            )

    role_key_map = {
        "Admin Utama": "admin",
        "Admin Sistem": "admin",
        "Operator CCTV": "operator",
        "Verifikator Tiket": "verifikator",
        "Teknisi Lapangan": "teknisi",
    }

    new_id = f"usr-{len(_personnel_store) + 1:03d}"
    new_user = {
        "id": new_id,
        "full_name": payload.full_name.strip(),
        "nip": payload.nip.strip(),
        "email": payload.email.strip().lower(),
        "role": payload.role,
        "role_key": role_key_map.get(payload.role, "operator"),
        "placement": payload.placement,
        "status": payload.status,
        "is_online": True if payload.status == "Aktif" else False,
        "last_active": "Baru saja terdaftar",
        "phone": payload.phone,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    _personnel_store.insert(0, new_user)
    logger.info(f"New user registered: {payload.full_name} ({new_id})")
    return UserPersonnel(**new_user)


@router.patch("/{user_id}", response_model=UserPersonnel)
def update_user(user_id: str, payload: UserUpdatePayload) -> UserPersonnel:
    """
    Updates personnel details, role, placement, or status.
    """
    target = None
    for item in _personnel_store:
        if item["id"] == user_id:
            target = item
            break

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personel dengan ID {user_id} tidak ditemukan.",
        )

    if payload.full_name is not None:
        target["full_name"] = payload.full_name.strip()
    if payload.nip is not None:
        target["nip"] = payload.nip.strip()
    if payload.email is not None:
        target["email"] = payload.email.strip().lower()
    if payload.role is not None:
        target["role"] = payload.role
        role_key_map = {
            "Admin Utama": "admin",
            "Admin Sistem": "admin",
            "Operator CCTV": "operator",
            "Verifikator Tiket": "verifikator",
            "Teknisi Lapangan": "teknisi",
        }
        target["role_key"] = role_key_map.get(payload.role, "operator")
    if payload.placement is not None:
        target["placement"] = payload.placement
    if payload.status is not None:
        target["status"] = payload.status
        target["is_online"] = True if payload.status == "Aktif" else False
    if payload.phone is not None:
        target["phone"] = payload.phone

    target["last_active"] = "Baru saja diperbarui"
    return UserPersonnel(**target)


@router.delete("/{user_id}")
def delete_user(user_id: str):
    """
    Removes personnel from system.
    """
    global _personnel_store
    existing = [p for p in _personnel_store if p["id"] == user_id]
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personel dengan ID {user_id} tidak ditemukan.",
        )

    _personnel_store = [p for p in _personnel_store if p["id"] != user_id]
    return {"status": "success", "message": f"Personel {user_id} berhasil dihapus."}
