from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# ==============================================================================
# ENUMS
# ==============================================================================

class CameraCode(str, Enum):
    EMPANG = "empang"
    SURKEN = "surken"
    BALAIKOTA = "balaikota"


class ModelChoice(str, Enum):
    YOLOV26N = "yolov26n"
    YOLOV8 = "yolov8"


class ValidationStatus(str, Enum):
    PENDING = "Pending"
    VALID = "Valid"
    INVALID = "Invalid"


class CameraStatus(str, Enum):
    CONNECTED = "Connected"
    RECONNECTING = "Reconnecting"
    FALLBACK_MODE = "Fallback_Mode"
    OFFLINE = "Offline"


# ==============================================================================
# CAMERA & ROI SCHEMAS
# ==============================================================================

class CameraConfigBase(BaseModel):
    camera_code: CameraCode = Field(..., description="Unique camera identifier ('empang', 'surken', 'balaikota')")
    camera_name: str = Field(..., description="Display name of the CCTV location")
    stream_url: Optional[str] = Field(None, description="BSW HLS stream URL (.m3u8)")
    resolution_width: int = Field(1920, ge=100, le=4096, description="Source frame width in pixels")
    resolution_height: int = Field(1080, ge=100, le=4096, description="Source frame height in pixels")
    roi_polygon: List[List[float]] = Field(
        default_factory=list,
        description="Normalized polygon vertices [[x1, y1], [x2, y2], ...] scaled 0.0 to 1.0",
    )
    threshold_seconds: int = Field(
        default=60,
        ge=10,
        le=600,
        description="Stationary duration threshold in seconds before triggering violation alert",
    )
    is_configured: bool = Field(False, description="Flag indicating if the camera ROI and settings are finalized")

    @field_validator("roi_polygon")
    @classmethod
    def validate_roi_coordinates(cls, vertices: List[List[float]]) -> List[List[float]]:
        """
        Validates normalized polygon coordinates.
        Vertices can be empty during initial onboarding before ROI is drawn.
        When non-empty, must contain >= 3 vertices, each with [x, y] in [0.0, 1.0].
        """
        if not vertices:
            return vertices

        if len(vertices) < 3:
            raise ValueError("ROI polygon must contain at least 3 vertices to form an enclosed area.")

        for idx, vertex in enumerate(vertices):
            if len(vertex) != 2:
                raise ValueError(f"Vertex at index {idx} must be a 2D coordinate [x, y], got {vertex}.")
            x, y = vertex
            if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0):
                raise ValueError(
                    f"Vertex at index {idx} ({x}, {y}) is out of normalized bounds [0.0, 1.0]."
                )
        return vertices


class CameraConfigCreate(CameraConfigBase):
    pass


class CameraConfigUpdate(BaseModel):
    """Schema for updating camera ROI polygon and threshold (PUT /api/cameras/{code}/config)."""

    roi_polygon: Optional[List[List[float]]] = Field(
        None,
        description="Updated normalized polygon coordinates [[x, y], ...]",
    )
    threshold_seconds: Optional[int] = Field(
        None,
        ge=10,
        le=600,
        description="Updated stationary duration threshold in seconds",
    )
    stream_url: Optional[str] = Field(None, description="Updated stream URL")
    is_configured: Optional[bool] = Field(None, description="Updated configuration flag")

    @field_validator("roi_polygon")
    @classmethod
    def validate_roi_coordinates(cls, vertices: Optional[List[List[float]]]) -> Optional[List[List[float]]]:
        if vertices is None or not vertices:
            return vertices

        if len(vertices) < 3:
            raise ValueError("ROI polygon must contain at least 3 vertices.")

        for idx, vertex in enumerate(vertices):
            if len(vertex) != 2:
                raise ValueError(f"Vertex at index {idx} must be a 2D coordinate [x, y].")
            x, y = vertex
            if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0):
                raise ValueError(
                    f"Vertex at index {idx} ({x}, {y}) must be normalized between 0.0 and 1.0."
                )
        return vertices


class CameraConfigResponse(CameraConfigBase):
    id: UUID
    status: Optional[CameraStatus] = CameraStatus.OFFLINE
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CameraStreamInfo(BaseModel):
    """Real-time operational status and frame metadata of a camera worker."""
    camera_code: CameraCode
    camera_name: str
    status: CameraStatus
    is_fallback: bool
    resolution_width: int
    resolution_height: int
    fps: float
    frames_extracted: int
    last_frame_time: Optional[str] = None
    source: Optional[str] = None


# ==============================================================================
# MODEL SWITCHER SCHEMAS
# ==============================================================================

class ModelSwitchRequest(BaseModel):
    """Request payload for switching active detection model (POST /api/model/switch)."""

    model_name: ModelChoice = Field(
        ...,
        description="Target YOLO model architecture ('yolov26n' for primary or 'yolov8' for baseline comparison)",
    )


class ModelSwitchResponse(BaseModel):
    success: bool
    active_model: str
    model_weight_file: str
    message: str


# ==============================================================================
# VIOLATION EVENT & VALIDATION SCHEMAS
# ==============================================================================

class ViolationEventBase(BaseModel):
    camera_id: UUID
    vehicle_track_id: str = Field(..., description="ByteTrack tracked ID (e.g., 'Angkot_04')")
    detected_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of violation")
    duration_seconds: int = Field(..., ge=0, description="Total loitering duration in seconds")
    model_used: str = Field(..., description="Active YOLO model at capture time ('YOLOv26n' or 'YOLOv8')")
    inference_ms: Optional[float] = Field(None, description="Inference latency in milliseconds")
    evidence_path: Optional[str] = Field(None, description="Storage object path in Supabase Storage")
    session_type: Optional[str] = Field(None, description="Rush hour category ('Rush Hour Pagi', 'Off-Peak Siang', 'Rush Hour Sore', 'Akhir Pekan')")
    validation_status: ValidationStatus = Field(
        default=ValidationStatus.PENDING,
        description="Human-in-the-loop review status ('Pending', 'Valid', 'Invalid')",
    )


class ViolationEventCreate(ViolationEventBase):
    pass


class ViolationEventValidateRequest(BaseModel):
    """Payload for operator human-in-the-loop review (PATCH /api/events/{id}/validate)."""

    validation_status: ValidationStatus = Field(
        ...,
        description="Validated review decision ('Valid' to confirm or 'Invalid' to reject)",
    )
    validated_by: Optional[UUID] = Field(None, description="Supabase Auth UUID of the operator")
    plate_number: Optional[str] = Field(None, description="Manual license plate number verified/corrected by operator")
    reason: Optional[str] = Field(None, description="Reason or violation category")
    notes: Optional[str] = Field(None, description="Operator notes during review")


class ViolationEventResponse(ViolationEventBase):
    id: UUID
    camera_code: Optional[str] = None
    camera_name: Optional[str] = None
    plate_number: Optional[str] = Field(None, description="Manual verified license plate")
    reason: Optional[str] = Field(None, description="Violation reason category")
    notes: Optional[str] = Field(None, description="Operator notes")
    evidence_image_url: Optional[str] = Field(None, description="Publicly accessible URL to evidence image")
    validated_by: Optional[UUID] = None
    validated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ==============================================================================
# WEBSOCKET REAL-TIME ALERT SCHEMA
# ==============================================================================

class AlertBroadcastPayload(BaseModel):
    """Payload dispatched across WebSockets (/ws/alerts) when auto-capture triggers."""

    event_id: str
    camera_code: str
    camera_name: str
    vehicle_track_id: str
    detected_at: str
    duration_seconds: int
    threshold_seconds: Optional[int] = 60
    model_used: str
    inference_ms: Optional[float] = None
    session_type: Optional[str] = None
    evidence_url: Optional[str] = None
    validation_status: str = "Pending"



# ==============================================================================
# ONBOARDING SETUP SCHEMAS
# ==============================================================================

class OnboardingStep1Payload(BaseModel):
    location_name: str = Field(..., description="Nama konfigurasi lokasi (misal: Pos Pemantauan Empang - Titik A)")
    sector: str = Field(..., description="Sektor Pengawasan Dishub (misal: Bogor Selatan (Empang, Batutulis, Cipaku))")
    operator_name: str = Field(..., description="Nama Penanggung Jawab / Operator")
    operator_nip: str = Field(..., description="NIP Operator")
    shift: str = Field(default="Shift Pagi (06.00–14.00)")
    trayek_references: List[str] = Field(
        default_factory=lambda: [
            "02 Sukasari - Bubulak",
            "03 Baranangsiang - Bubulak",
            "14 Pasir Kuda - Sukasari",
        ],
        description="Master Data Trayek Jalur Ini (Referensi acuan manual rute umum, bukan klasifikasi AI)",
    )
    camera_code: Optional[str] = Field("empang", description="Kode kamera sasaran")
    is_draft: bool = Field(False, description="Tandai draf jika belum final")


class OnboardingStep1Response(OnboardingStep1Payload):
    updated_at: str
    status: str = "success"
    message: str = "Konfigurasi identifikasi pos berhasil disimpan"


class OnboardingStep4Payload(BaseModel):
    camera_code: str = Field("empang", description="Kode kamera target ('empang', 'surken', 'balaikota')")
    threshold_seconds: int = Field(120, ge=30, le=600, description="Ambang batas durasi henti ngetem dalam detik")
    tolerance_buffer_seconds: int = Field(15, ge=0, le=60, description="Buffer toleransi dinamis (lansia/barang bawaan)")
    is_draft: bool = Field(False, description="Tandai draf jika belum final")


class OnboardingStep4Response(BaseModel):
    camera_code: str
    threshold_seconds: int
    tolerance_buffer_seconds: int
    total_effective_threshold: int
    estimated_violations_per_day: int
    congestion_reduction_percent: float
    status: str = "success"
    message: str = "Parameter durasi & sensitivitas alarm berhasil diperbarui"
    updated_at: str
