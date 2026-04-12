from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class I18nService:
    def __init__(self, app_root: str, default_lang: str = "es") -> None:
        self.default_lang = default_lang
        self.i18n_dir = Path(app_root) / "i18n"
        self._last_loaded_mtime = 0.0
        self.translations = self._load_translations()
        self.supported_langs = sorted(self.translations.keys())

    def _load_translations(self) -> dict[str, dict[str, Any]]:
        result: dict[str, dict[str, Any]] = {}

        for file_path in self.i18n_dir.glob("*.json"):
            with file_path.open("r", encoding="utf-8") as i18n_file:
                result[file_path.stem] = json.load(i18n_file)

        if self.default_lang not in result:
            raise ValueError(f"Missing default language file: {self.default_lang}.json")

        self._last_loaded_mtime = self._get_latest_mtime()

        return result

    def _get_latest_mtime(self) -> float:
        json_files = list(self.i18n_dir.glob("*.json"))
        if not json_files:
            return 0.0
        return max(file_path.stat().st_mtime for file_path in json_files)

    def reload_if_needed(self) -> None:
        latest_mtime = self._get_latest_mtime()
        if latest_mtime <= self._last_loaded_mtime:
            return

        self.translations = self._load_translations()
        self.supported_langs = sorted(self.translations.keys())

    def get_request_lang(self, requested_lang: str | None) -> str:
        self.reload_if_needed()
        if requested_lang and requested_lang in self.translations:
            return requested_lang
        return self.default_lang

    def translate(self, key: str, lang: str) -> str:
        lang_dict = self.translations.get(lang, self.translations[self.default_lang])
        fallback_dict = self.translations[self.default_lang]

        lang_value = self._resolve_key(lang_dict, key)
        if lang_value is not None:
            return str(lang_value)

        fallback_value = self._resolve_key(fallback_dict, key)
        if fallback_value is not None:
            return str(fallback_value)

        return key

    @staticmethod
    def _resolve_key(dictionary: dict[str, Any], key: str) -> Any | None:
        current: Any = dictionary
        for part in key.split("."):
            if not isinstance(current, dict) or part not in current:
                return None
            current = current[part]
        return current
