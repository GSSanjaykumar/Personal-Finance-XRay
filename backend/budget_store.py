from backend.repositories.budget_repository import BudgetRepository
from backend.auth.user_context import UserContext

DEFAULT_BUDGET = {
    "Food & Dining": 10000,
    "Shopping": 15000,
    "Transport": 8000,
    "Bills": 12000,
    "Others": 10000
}

_repo = BudgetRepository()

def get_budget():
    """
    Adapter method to get the current user's budget.
    Returns the default budget if none is set in the database.
    """
    user_id = UserContext.get_current_user_id()
    budget = _repo.find_by_user(user_id)
    if budget is None:
        return DEFAULT_BUDGET.copy()
    return budget

def save_budget(new_budget: dict):
    """
    Adapter method to save the current user's budget.
    """
    user_id = UserContext.get_current_user_id()
    _repo.update_by_user(user_id, new_budget)