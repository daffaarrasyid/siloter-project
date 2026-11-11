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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


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


class ViolationEventResponse(ViolationEventBase):
    id: UUID
    camera_code: Optional[str] = None
    camera_name: Optional[str] = None
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
    model_used: str
    evidence_url: Optional[str] = None
    validation_status: str = "Pending"

