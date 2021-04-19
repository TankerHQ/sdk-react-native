from flask import Flask, request
import os
import tankeradminsdk
import tankersdk_identity
import atexit
import random

app = Flask(__name__)


def assert_env(name: str) -> str:
    value = os.environ.get(name)
    assert value, f"{name} should be set before running tests"
    return value


def make_admin() -> tankeradminsdk.Admin:
    id_token = assert_env("TANKER_ID_TOKEN")
    url = assert_env("TANKER_ADMIND_URL")
    return tankeradminsdk.Admin(url=url, id_token=id_token)


admin = make_admin()
tanker_app = admin.create_app("test-react-native", is_test=True)


def delete_app() -> None:
    admin.delete_app(tanker_app["id"])


atexit.register(delete_app)


@app.route("/health")
def health() -> str:
    return "{}"


@app.route("/get_app_id")
def get_app_id() -> str:
    return tanker_app["id"]


@app.route("/get_tanker_url")
def get_tanker_url() -> str:
    return assert_env("TANKER_APPD_URL")


@app.route("/toggle_session_certificates", methods=["POST"])
def toggle_session_certificates() -> None:
    enable = request.form["enable"].lower() == 'true'
    return admin.update_app(tanker_app["id"], session_certificates=enable)


@app.route("/create_identity")
def create_identity() -> str:
    return tankersdk_identity.create_identity(
        tanker_app["id"],
        tanker_app["app_secret"],
        str(random.random()),
    )


@app.route("/create_provisional_identity", methods=["POST"])
def create_provisional_identity() -> str:
    return tankersdk_identity.create_provisional_identity(
        tanker_app["id"], request.form["email"]
    )


@app.route("/get_public_identity", methods=["POST"])
def get_public_identity() -> str:
    return tankersdk_identity.get_public_identity(request.form["identity"])


@app.route("/get_verification_code", methods=["POST"])
def get_verification_code() -> str:
    return tankeradminsdk.get_verification_code(
        url=assert_env("TANKER_TRUSTCHAIND_URL"),
        app_id=tanker_app["id"],
        auth_token=tanker_app["auth_token"],
        email=request.form["email"],
    )
