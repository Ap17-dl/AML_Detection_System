from fastapi import HTTPException


class ApiError(HTTPException):
    """Raised for any business-logic error; rendered via the shared error envelope.

    See TRD §5: `{ "error": { "code", "message", "details" } }`.
    """

    def __init__(self, status_code: int, code: str, message: str, details: dict | None = None):
        super().__init__(
            status_code=status_code, detail={"code": code, "message": message, "details": details}
        )
