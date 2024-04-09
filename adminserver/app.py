import json
import os
import random
import signal
import sys
from typing import Any, Dict

import tankeradminsdk
import tankersdk_identity
from flask import Flask, abort, request, Response


class TankerAppHolder:
    def __init__(
        self,
        tanker_app: Dict[str, str],
    ):
        self.app = tanker_app

    def cleanup(self):
        print(f'deleting app {self.app["id"]}')
        admin.delete_app(self.app["id"])
        self.app = None

    def _sighandler(self, _signum, _frame):
        sys.exit()  # Will trigger cleanup

    def __enter__(self):
        signal.signal(signal.SIGTERM, self._sighandler)
        return self

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        self.cleanup()


def assert_env(name: str) -> str:
    value = os.environ.get(name)
    assert value, f"{name} should be set before running tests"
    return value


def make_admin() -> tankeradminsdk.Admin:
    return tankeradminsdk.Admin(
        app_management_token=assert_env("TANKER_MANAGEMENT_API_ACCESS_TOKEN"),
        environment_name=assert_env("TANKER_MANAGEMENT_API_DEFAULT_ENVIRONMENT_NAME"),
        url=assert_env("TANKER_MANAGEMENT_API_URL"),
    )


app = Flask(__name__)


@app.route("/health")
def health() -> str:
    return "{}"


@app.route("/get_app_id")
def get_app_id() -> str:
    return tanker_holder.app["id"]


@app.route("/get_tanker_url")
def get_tanker_url() -> str:
    return assert_env("TANKER_APPD_URL")


@app.route("/create_identity")
def create_identity() -> str:
    return tankersdk_identity.create_identity(
        tanker_holder.app["id"],
        tanker_holder.app["secret"],
        str(random.random()),
    )


@app.route("/create_provisional_identity", methods=["POST"])
def create_provisional_identity() -> str:
    return tankersdk_identity.create_provisional_identity(
        tanker_holder.app["id"], "email", request.form["email"]
    )


@app.route("/get_public_identity", methods=["POST"])
def get_public_identity() -> str:
    return tankersdk_identity.get_public_identity(request.form["identity"])


@app.route("/get_verification_code", methods=["POST"])
def get_verification_code() -> str:
    if request.form.get("email"):
        return tankeradminsdk.get_verification_code_email(
            url=assert_env("TANKER_TRUSTCHAIND_URL"),
            app_id=tanker_holder.app["id"],
            verification_api_token=assert_env("TANKER_VERIFICATION_API_TEST_TOKEN"),
            email=request.form["email"],
        )
    if request.form.get("phone_number"):
        res = tankeradminsdk.get_verification_code_sms(
            url=assert_env("TANKER_TRUSTCHAIND_URL"),
            app_id=tanker_holder.app["id"],
            verification_api_token=assert_env("TANKER_VERIFICATION_API_TEST_TOKEN"),
            phone_number=request.form["phone_number"],
        )
        return res
    abort(400)


@app.route("/get_oidc_config")
def get_oidc_config() -> str:
    return json.dumps(
        {
            "client_id": assert_env("TANKER_OIDC_CLIENT_ID"),
            "client_secret": assert_env("TANKER_OIDC_CLIENT_SECRET"),
            "provider_name": assert_env("TANKER_OIDC_PROVIDER"),
            "issuer": assert_env("TANKER_OIDC_ISSUER"),
            "fake_oidc_issuer_url": f'{assert_env("TANKER_FAKE_OIDC_URL")}/issuer',
            "users": {
                "martine": {
                    "email": assert_env("TANKER_OIDC_MARTINE_EMAIL"),
                    "refresh_token": assert_env("TANKER_OIDC_MARTINE_REFRESH_TOKEN"),
                },
                "kevin": {
                    "email": assert_env("TANKER_OIDC_KEVIN_EMAIL"),
                    "refresh_token": assert_env("TANKER_OIDC_KEVIN_REFRESH_TOKEN"),
                },
            },
        }
    )


@app.route("/app_update", methods=["POST"])
def app_update() -> Response:
    admin.update_app(
        tanker_holder.app["id"],
        oidc_client_id=request.form["oidc_client_id"],
        oidc_display_name=request.form["oidc_display_name"],
        oidc_issuer=request.form["oidc_issuer"],
    )
    return Response(status=200)


if __name__ == "__main__":
    admin = make_admin()
    with TankerAppHolder(admin.create_app("sdk-react-native-tests")) as tanker_holder:
        print(f'created app {tanker_holder.app["id"]}')
        app.run()
