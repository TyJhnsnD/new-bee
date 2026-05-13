import json
import os
import sqlite3
from flask import Blueprint, current_app, render_template, request, abort, redirect, url_for

main_bp = Blueprint("main", __name__)
BLOG_DATA_PATH = os.path.join(os.path.dirname(__file__), "static", "data", "blogs.json")
COMMENTS_DB_PATH = os.path.join(os.path.dirname(__file__), "comments.db")


def get_comments_connection():
    conn = sqlite3.connect(COMMENTS_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_comments_db():
    conn = get_comments_connection()
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_slug TEXT NOT NULL,
                text TEXT NOT NULL CHECK(length(text) <= 50),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TRIGGER IF NOT EXISTS comments_max_rows
            BEFORE INSERT ON comments
            BEGIN
                SELECT CASE
                    WHEN (SELECT COUNT(*) FROM comments) >= 200
                    THEN RAISE(ABORT, 'comment limit reached')
                END;
            END;
            """
        )
    conn.close()
    seed_comment_examples()


def seed_comment_examples():
    conn = get_comments_connection()
    with conn:
        cursor = conn.execute("SELECT COUNT(*) FROM comments")
        total = cursor.fetchone()[0]
        if total > 0:
            return

        comments_to_add = [
            ("de-la-colmena-al-consumidor", "La apicultura fortalece el comercio local."),
            ("de-la-colmena-al-consumidor", "Muy buen resumen del proceso de la miel."),
            ("miel-multifloral-vs-organica", "Excelente comparación entre tipos de miel."),
            ("miel-multifloral-vs-organica", "Me gustó que explicas la certificación orgánica."),
            ("la-miel-caduca", "Nunca imaginé que la miel puede durar tanto."),
            ("la-miel-caduca", "Muy útil esta información sobre conservación."),
            ("miel-vs-azucar", "Claro y fácil de entender el contraste."),
            ("miel-vs-azucar", "Me ayudó a decidir mejor qué consumir."),
            ("la-miel-para-la-tos", "Funciona perfecto con limón y miel."),
            ("la-miel-para-la-tos", "Comentario útil para la tos seca."),
            ("snacks-saludables-con-miel", "Probaré la receta de yogurt con miel."),
            ("snacks-saludables-con-miel", "Ideas simples y naturales, gracias."),
            ("como-hacen-la-miel-las-abejas", "Me encantó saber cómo trabajan las abejas."),
            ("como-hacen-la-miel-las-abejas", "Excelente explicación del proceso paso a paso."),
            ("que-debes-revisar-antes-de-comprar-miel", "Muy útil la guía para elegir miel auténtica."),
            ("que-debes-revisar-antes-de-comprar-miel", "Gracias por el detalle de la etiqueta."),
            ("importancia-ecologica-abejas-produccion-miel", "Es vital proteger a las abejas de los pesticidas."),
            ("importancia-ecologica-abejas-produccion-miel", "Importante recordar su valor ecológico."),
        ]
        conn.executemany(
            "INSERT INTO comments (article_slug, text) VALUES (?, ?)"
            , comments_to_add
        )
    conn.close()


def load_comments_for_article(slug):
    conn = get_comments_connection()
    with conn:
        rows = conn.execute(
            "SELECT text, created_at FROM comments WHERE article_slug = ? ORDER BY id ASC",
            (slug,),
        ).fetchall()
    conn.close()
    return rows


def load_blog_articles():
    try:
        with open(BLOG_DATA_PATH, "r", encoding="utf-8") as source:
            return json.load(source)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


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


@main_bp.route("/blog/<slug>", methods=["GET", "POST"])
def blog_detail(slug):
    i18n_service = current_app.config["I18N_SERVICE"]
    current_lang = i18n_service.get_request_lang(request.args.get("lang"))

    articles = load_blog_articles()
    article = next((item for item in articles if item.get("slug") == slug), None)

    if article is None:
        abort(404)

    ensure_comments_db()
    error = None

    if request.method == "POST":
        comment_text = request.form.get("comment", "").strip()
        if not comment_text:
            error = "El comentario no puede estar vacío."
        elif len(comment_text) > 50:
            error = "El comentario debe tener máximo 50 caracteres."
        else:
            try:
                conn = get_comments_connection()
                with conn:
                    conn.execute(
                        "INSERT INTO comments (article_slug, text) VALUES (?, ?)",
                        (slug, comment_text),
                    )
                conn.close()
                return redirect(url_for("main.blog_detail", slug=slug, lang=current_lang))
            except sqlite3.IntegrityError:
                error = "No se pueden guardar más comentarios en este momento."
            except sqlite3.DatabaseError:
                error = "Error al guardar el comentario. Intenta de nuevo."

    comments = load_comments_for_article(slug)
    return render_template(
        "blog_detail.html",
        current_lang=current_lang,
        article=article,
        comments=comments,
        comment_error=error,
    )
