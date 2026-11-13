import json
import logging
from pathlib import Path
import re
import threading
import time
from typing import Dict, Optional, Tuple

from app.core.config import BASE_DIR
from app.core.supabase_client import get_supabase_client

logger = logging.getLogger("siloter.track_id_manager")


class PersistentTrackIdManager:
    """
    Persistent, Monotonic Track ID Generator.
    Guarantees that vehicle Track IDs (e.g., 'TRK-0001', 'TRK-0002') never duplicate
    across system restarts, multiple cameras, stream reconnects, or time intervals.
    """

    def __init__(self, data_file: Optional[Path] = None, timeout_seconds: float = 15.0):
        self.data_dir = BASE_DIR / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.data_file = data_file or (self.data_dir / "track_counter.json")
        self.timeout_seconds = timeout_seconds

        self._lock = threading.Lock()
        # (camera_code, raw_track_id) -> persistent_track_id
        self._active_map: Dict[Tuple[str, int], str] = {}
        # (camera_code, raw_track_id) -> last_seen_epoch
        self._last_seen: Dict[Tuple[str, int], float] = {}

        self._counter: int = self._load_initial_counter()
        logger.info(f"PersistentTrackIdManager initialized with starting counter: {self._counter}")

    def _load_initial_counter(self) -> int:
        """Loads counter from local file to ensure monotonic progression."""
        highest_id = 0

        # Read from local persistence file if exists
        if self.data_file.exists():
            try:
                with open(self.data_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    highest_id = max(highest_id, int(data.get("counter", 0)))
            except Exception as e:
                logger.warning(f"Failed to read track_counter.json: {e}")

        return highest_id

    def _save_counter(self) -> None:
        """Persists the current counter to disk."""
        try:
            temp_file = self.data_file.with_suffix(".tmp")
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump({"counter": self._counter, "updated_at": time.time()}, f, indent=2)
            temp_file.replace(self.data_file)
        except Exception as e:
            logger.error(f"Failed to save track_counter.json: {e}")

    def get_or_create(self, camera_code: str, raw_track_id: Optional[int]) -> str:
        """
        Translates a transient ByteTrack raw ID into a persistent monotonic Track ID.
        If the same vehicle is observed within timeout_seconds, retains the assigned ID.
        If the raw ID is recycled after leaving the view, assigns a fresh monotonic ID.
        """
        if raw_track_id is None:
            return "TRK-UNTRACKED"

        cam = (camera_code or "default").strip().lower()
        key = (cam, raw_track_id)
        now = time.time()

        with self._lock:
            # Check if active and not timed out
            if key in self._active_map:
                last_time = self._last_seen.get(key, 0.0)
                if (now - last_time) <= self.timeout_seconds:
                    self._last_seen[key] = now
                    return self._active_map[key]

            # Periodic cleanup of old stale mappings (> 30s)
            stale_keys = [k for k, t in self._last_seen.items() if (now - t) > 30.0]
            for sk in stale_keys:
                self._active_map.pop(sk, None)
                self._last_seen.pop(sk, None)

            # Assign fresh monotonic Track ID
            self._counter += 1
            persistent_id = f"TRK-{self._counter:04d}"
            self._active_map[key] = persistent_id
            self._last_seen[key] = now
            self._save_counter()

            logger.info(
                f"[{cam}] Assigned persistent Track ID: {persistent_id} (from raw ByteTrack ID {raw_track_id})"
            )
            return persistent_id

    def peek_counter(self) -> int:
        with self._lock:
            return self._counter


# Singleton instance
track_id_manager = PersistentTrackIdManager()
