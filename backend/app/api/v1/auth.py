from fastapi import APIRouter, Depends

from app.core.security import CurrentUser, get_current_user
from app.schemas.user import CurrentUserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=CurrentUserOut)
async def read_current_user(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUserOut:
    """Returns the authenticated user's profile & role, resolved from the verified Supabase JWT."""
    return CurrentUserOut(
        user_id=current_user.user_id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role_name,
    )
