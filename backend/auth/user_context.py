from contextvars import ContextVar

_current_user_id: ContextVar[str] = ContextVar("current_user_id", default="default_user")

class UserContext:
    @staticmethod
    def get_current_user_id() -> str:
        """
        Returns the ID of the currently authenticated user.
        """
        return _current_user_id.get()

    @staticmethod
    def set_current_user_id(user_id: str):
        """
        Sets the ID of the currently authenticated user for this context.
        """
        _current_user_id.set(user_id)
