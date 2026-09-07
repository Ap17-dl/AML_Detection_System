"""RBAC deny/allow matrix for the `require_role` dependency (TRD §4.1, §6.3).

Per 05_Implementation_Plan.md's Sprint 1 risk mitigation: "freeze RBAC contract early; write
the deny/allow matrix test first."
"""

import pytest

from app.core.errors import ApiError
from app.core.security import require_role
from app.models.role import RoleName
from app.tests.conftest import make_current_user

ADMIN_ONLY = (RoleName.ADMINISTRATOR,)
ADMIN_OR_ANALYST = (RoleName.ADMINISTRATOR, RoleName.AML_ANALYST)
ANALYST_OR_OPERATOR = (RoleName.AML_ANALYST, RoleName.DATA_OPERATOR)

MATRIX = [
    # (allowed_roles, caller_role, expected_to_pass)
    (ADMIN_ONLY, RoleName.ADMINISTRATOR, True),
    (ADMIN_ONLY, RoleName.AML_ANALYST, False),
    (ADMIN_ONLY, RoleName.DATA_OPERATOR, False),
    (ADMIN_OR_ANALYST, RoleName.ADMINISTRATOR, True),
    (ADMIN_OR_ANALYST, RoleName.AML_ANALYST, True),
    (ADMIN_OR_ANALYST, RoleName.DATA_OPERATOR, False),
    (ANALYST_OR_OPERATOR, RoleName.DATA_OPERATOR, True),
    (ANALYST_OR_OPERATOR, RoleName.ADMINISTRATOR, False),
]


@pytest.mark.parametrize("allowed_roles,caller_role,should_pass", MATRIX)
async def test_require_role_matrix(allowed_roles, caller_role, should_pass):
    dependency = require_role(*allowed_roles)
    caller = make_current_user(caller_role)

    if should_pass:
        result = await dependency(current_user=caller)
        assert result is caller
    else:
        with pytest.raises(ApiError) as exc_info:
            await dependency(current_user=caller)
        assert exc_info.value.status_code == 403
