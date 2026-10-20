"""Sentry error reporting, opt-in via SENTRY_DSN.

Off by default: an unset DSN makes every call a no-op, so local dev, tests
and forks never phone home. When enabled, unhandled request errors and
background-task crashes are reported with the app version as the release.

PII is deliberately off (``send_default_pii=False``): the app handles
emails, tokens and private messages, and Sentry should receive stack traces,
not user content.
"""

import logging
import sys

from app.database.config import settings

logger = logging.getLogger(__name__)


def init_sentry() -> bool:
    """Initialise Sentry if configured. Returns True when enabled."""
    dsn = (settings.SENTRY_DSN or "").strip()
    if not dsn:
        return False
    # Test runs import backend/.env too; their deliberately-failing requests
    # are not production incidents and would burn quota.
    if "pytest" in sys.modules:
        return False
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
    except ImportError:
        logger.warning(
            "[sentry] SENTRY_DSN is set but sentry-sdk is not installed; "
            "error reporting disabled"
        )
        return False

    try:
        rate = float(settings.SENTRY_TRACES_SAMPLE_RATE)
    except (TypeError, ValueError):
        rate = 0.0
    rate = max(0.0, min(1.0, rate))

    environment = settings.SENTRY_ENVIRONMENT or settings.APP_ENV or "development"
    release = f"kb-chat@{settings.APP_VERSION}"
    try:
        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            release=release,
            traces_sample_rate=rate,
            send_default_pii=False,
            # Sentry otherwise probes every installed framework at startup to
            # auto-enable its integration. This app ships scipy/langchain, so
            # that probe imports them and stalls boot for tens of seconds.
            # The two integrations we actually need are listed explicitly.
            auto_enabling_integrations=False,
            integrations=[StarletteIntegration(), FastApiIntegration()],
        )
    except Exception as e:  # never let monitoring break startup
        logger.error(f"[sentry] init failed: {e}")
        return False

    logger.info(f"[sentry] enabled (env={environment}, release={release})")
    return True
