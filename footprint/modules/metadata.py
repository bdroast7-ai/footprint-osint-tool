from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from PIL import Image
from PIL.ExifTags import GPSTAGS, TAGS

@dataclass
class MetadataResult:
    filename:           str
    make:               Optional[str]   = None
    model:              Optional[str]   = None
    software:           Optional[str]   = None
    datetime_original:  Optional[str]   = None
    latitude:           Optional[str]   = None
    longitude:          Optional[str]   = None
    altitude:           Optional[str]   = None
    latitude_decimal:   Optional[float] = None
    longitude_decimal:  Optional[float] = None
    maps_url:           Optional[str]   = None
    raw_exif:           dict            = None

    def __post_init__(self) -> None:
        if self.raw_exif is None:
            self.raw_exif = {}

def _rational_to_float(value: object) -> float:
    if hasattr(value, "numerator"):
        return float(value.numerator) / float(value.denominator)
    if isinstance(value, tuple):
        num, den = value
        return float(num) / float(den) if den else 0.0
    return float(value)

def _dms_to_decimal(dms_tuple: tuple, ref: str) -> float:
    degrees = _rational_to_float(dms_tuple[0])
    minutes = _rational_to_float(dms_tuple[1])
    seconds = _rational_to_float(dms_tuple[2])
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref.upper() in ("S", "W"):
        decimal = -decimal
    return round(decimal, 7)

def extract_metadata(image_path: Path) -> MetadataResult:
    result = MetadataResult(filename=image_path.name)
    try:
        with Image.open(image_path) as img:
            exif_data = img._getexif()
            if exif_data is None:
                return result
            decoded_exif: dict[str, object] = {}
            for tag_id, value in exif_data.items():
                tag_name = TAGS.get(tag_id, f"Tag_{tag_id}")
                decoded_exif[tag_name] = value
            result.raw_exif = decoded_exif
            result.make = str(decoded_exif.get("Make", "")).strip() or None
            result.model = str(decoded_exif.get("Model", "")).strip() or None
            result.software = str(decoded_exif.get("Software", "")).strip() or None
            result.datetime_original = str(decoded_exif.get("DateTimeOriginal", "")).strip() or None

            gps_ifd = decoded_exif.get("GPSInfo")
            if gps_ifd and isinstance(gps_ifd, dict):
                gps = {GPSTAGS.get(k, f"GPS_{k}"): v for k, v in gps_ifd.items()}
                lat_dms = gps.get("GPSLatitude")
                lat_ref = str(gps.get("GPSLatitudeRef", "N"))
                lon_dms = gps.get("GPSLongitude")
                lon_ref = str(gps.get("GPSLongitudeRef", "E"))
                if lat_dms and lon_dms:
                    lat_dec = _dms_to_decimal(lat_dms, lat_ref)
                    lon_dec = _dms_to_decimal(lon_dms, lon_ref)
                    result.latitude_decimal = lat_dec
                    result.longitude_decimal = lon_dec
                    result.latitude = f"{abs(lat_dec):.6f}° {lat_ref}"
                    result.longitude = f"{abs(lon_dec):.6f}° {lon_ref}"
                    result.maps_url = f"https://www.google.com/maps/search/?api=1&query={lat_dec},{lon_dec}"
    except Exception:
        pass
    return result
