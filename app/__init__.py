from flask import Flask

from app.routes import main_bp
from app.services.i18n import I18nService


def create_app() -> Flask:
    app = Flask(__name__)

    i18n_service = I18nService(app.root_path)
    app.config["I18N_SERVICE"] = i18n_service

    @app.context_processor
    def inject_i18n_helpers():
        from flask import request

        i18n_service.reload_if_needed()
        current_lang = i18n_service.get_request_lang(request.args.get("lang"))

        def t(key: str) -> str:
            return i18n_service.translate(key, current_lang)

        return {
            "t": t,
            "current_lang": current_lang,
            "supported_langs": i18n_service.supported_langs,
        }

    app.register_blueprint(main_bp)
    return app
