import httpx

from app.core.config import get_settings
from app.core.errors import ApiError


class SupabaseAdminClient:
    """Thin wrapper over the Supabase Auth Admin REST API (TRD §4.1: user invites/role admin).

    Uses SUPABASE_SERVICE_ROLE_KEY, which is never exposed to the frontend.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = f"{settings.supabase_url}/auth/v1/admin"
        self._headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
        }

    async def invite_user_by_email(self, email: str, role_id: int) -> dict:
        """Invites a new user, stamping the initial role into app_metadata.

        The `handle_new_user()` DB trigger (03_Backend_Schema.md §3.1) reads
        `raw_app_meta_data->>'role_id'` to seed `public.users.role_id` on signup.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self._base_url}/invite",
                headers=self._headers,
                json={"email": email, "app_metadata": {"role_id": role_id}},
            )
        if response.status_code >= 400:
            raise ApiError(
                response.status_code,
                "supabase_invite_failed",
                "Supabase Auth rejected the invite request.",
                details=response.json() if response.content else None,
            )
        return response.json()


def get_supabase_admin_client() -> SupabaseAdminClient:
    return SupabaseAdminClient()
