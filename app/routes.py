from flask import Blueprint, current_app, render_template, request

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def home():
    i18n_service = current_app.config["I18N_SERVICE"]
    current_lang = i18n_service.get_request_lang(request.args.get("lang"))

    return render_template("index.html", current_lang=current_lang)


@main_bp.route("/blog")
def blog_placeholder():
    i18n_service = current_app.config["I18N_SERVICE"]
    current_lang = i18n_service.get_request_lang(request.args.get("lang"))

    return render_template("blog_placeholder.html", current_lang=current_lang)
