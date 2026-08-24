from backend.repositories.budget_repository import BudgetRepository
DEFAULT_BUDGET = {
    "Food & Dining": 10000,
    "Shopping": 15000,
    "Transport": 8000,
    "Bills": 12000,
    "Others": 10000
}

_repo = BudgetRepository()

def get_budget(user_id: str):
    """
    Adapter method to get the specific user's budget.
    Returns the default budget if none is set in the database.
    """
    budget = _repo.find_by_user(user_id)
    if budget is None:
        return DEFAULT_BUDGET.copy()
    return budget

def save_budget(user_id: str, new_budget: dict):
    """
    Adapter method to save the specific user's budget.
    """
    _repo.update_by_user(user_id, new_budget)