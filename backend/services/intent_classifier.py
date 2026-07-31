"""
Intent Classifier
=================
Classifies a user's natural-language financial question into one of the
supported intents using keyword/regex matching.

Also performs lightweight entity extraction (amounts, categories, merchants)
and assigns a confidence score.

Supported intents
-----------------
budget_advice      | Questions about budget limits & status
savings_advice     | Questions about saving more money
forecast           | Future-oriented spending / savings questions
spending_analysis  | Overall spend breakdown
category_analysis  | Spend in a specific category
merchant_analysis  | Specific merchant / brand questions
subscription_review| Subscriptions & recurring payments
financial_health   | Health score, grade, overall wellbeing
expense_summary    | Total expenses this period
income_summary     | Total income this period
comparison         | Month-on-month or period comparisons
recommendations    | What should I do / improve
general            | Anything else (uses summary + insights)
"""

import re
from typing import Literal, TypedDict

# ── Type aliases ──────────────────────────────────────────────────────────────
Intent = Literal[
    "budget_advice",
    "savings_advice",
    "forecast",
    "spending_analysis",
    "category_analysis",
    "merchant_analysis",
    "subscription_review",
    "financial_health",
    "expense_summary",
    "income_summary",
    "comparison",
    "recommendations",
    "general",
]

class ClassificationResult(TypedDict):
    intent: Intent
    confidence: float
    entities: list[str]

# ── Keyword map  (order matters — first match wins) ───────────────────────────
_INTENT_PATTERNS: list[tuple[Intent, list[str]]] = [
    ("subscription_review", [
        r"subscri", r"netflix", r"amazon prime", r"spotify", r"hotstar",
        r"disney", r"recurring", r"auto.?debit", r"cancel.*sub",
    ]),
    ("forecast", [
        r"forecast", r"predict", r"project", r"next month", r"end of month",
        r"by (year|month) end", r"if.*continue", r"trend",
        r"how much will i (save|spend)", r"year end",
    ]),
    ("savings_advice", [
        r"sav(e|ing|ings)", r"put aside", r"save ₹", r"save \d",
        r"can i save", r"how (much|to) save",
    ]),
    ("budget_advice", [
        r"budget", r"afford", r"can i buy", r"within limit", r"over budget",
        r"exceeded", r"remaining", r"limit",
    ]),
    ("financial_health", [
        r"health", r"score", r"grade", r"overall", r"financial status",
        r"how (am i|are my finances)", r"good shape", r"bad shape",
    ]),
    ("category_analysis", [
        r"food", r"dining", r"groceri", r"shopping", r"transport",
        r"travel", r"entertainment", r"bills", r"utilities", r"category",
        r"categor", r"how much.*on", r"spent on",
    ]),
    ("merchant_analysis", [
        r"merchant", r"brand", r"store", r"where.*spend", r"swiggy",
        r"zomato", r"flipkart", r"amazon", r"uber", r"ola", r"paytm",
        r"gpay", r"phonepe", r"which.*shop",
    ]),
    ("spending_analysis", [
        r"spending", r"biggest expense", r"most.*spend", r"where.*money",
        r"overspend", r"waste", r"expense breakdown", r"breakdown",
    ]),
    ("income_summary", [
        r"income", r"earn(ed|ing)?", r"salary", r"credit(s)?", r"how much.*made",
        r"total.*credit",
    ]),
    ("expense_summary", [
        r"expense", r"total.*debit", r"how much.*spent", r"total.*spend",
        r"total.*expense",
    ]),
    ("comparison", [
        r"compar", r"last month", r"previous month", r"vs\.?", r"versus",
        r"differ", r"better|worse than", r"change(d)?",
    ]),
    ("recommendations", [
        r"recommend", r"suggest", r"improve", r"should i", r"tips",
        r"advice", r"what to do", r"help me",
    ]),
]

_COMMON_MERCHANTS = [
    "swiggy", "zomato", "amazon", "flipkart", "uber", "ola", "netflix",
    "spotify", "hotstar", "disney", "blinkit", "zepto", "instamart",
    "starbucks", "mcdonalds", "kfc", "reliance", "dmart", "bigbasket",
    "myntra", "ajio", "bookmyshow", "makemytrip", "goibibo", "irctc"
]

_COMMON_CATEGORIES = [
    "food", "dining", "shopping", "transport", "bills", "utilities", 
    "travel", "entertainment", "health", "education", "groceries", "fuel"
]

_COMMON_PRODUCTS = [
    "laptop", "phone", "iphone", "car", "bike", "house", "tv", "macbook",
    "ipad", "watch"
]

def extract_entities(text: str) -> list[str]:
    """Extracts potential entities (amounts, merchants, categories, products) from text."""
    entities = []
    
    # Extract amounts (e.g., 1000, 1.2L, 1L, ₹500, 50,000)
    # Match standard numbers and Indian formatting
    amount_matches = re.finditer(r'(?:₹|rs\.?\s*)?(\d+(?:,\d+)*(?:\.\d+)?)\s*(L|lakh|K|k)?', text, re.IGNORECASE)
    for match in amount_matches:
        full_match = match.group(0).strip()
        num_str = match.group(1).replace(",", "")
        multiplier = match.group(2)
        if multiplier:
            multiplier = multiplier.lower()
            if multiplier in ('l', 'lakh'):
                val = float(num_str) * 100000
                entities.append(str(int(val)))
            elif multiplier == 'k':
                val = float(num_str) * 1000
                entities.append(str(int(val)))
        else:
            # If it's a standalone number, ensure it's not a generic word
            # But regex already ensures it starts with digits
            entities.append(num_str)
            
    # Extract common merchants
    for m in _COMMON_MERCHANTS:
        if re.search(r'\b' + m + r'\b', text, re.IGNORECASE):
            # Title case it for nicer entity output
            entities.append(m.title())
            
    # Extract common categories
    for c in _COMMON_CATEGORIES:
        if re.search(r'\b' + c + r'\b', text, re.IGNORECASE):
            entities.append(c.title())
            
    # Extract products
    for p in _COMMON_PRODUCTS:
        if re.search(r'\b' + p + r'\b', text, re.IGNORECASE):
            # Special casing for known brands
            if p.lower() == 'iphone':
                entities.append('iPhone')
            elif p.lower() == 'macbook':
                entities.append('MacBook')
            elif p.lower() == 'ipad':
                entities.append('iPad')
            elif p.lower() == 'tv':
                entities.append('TV')
            else:
                entities.append(p.title())
                
    # Remove duplicates but preserve order
    return list(dict.fromkeys(entities))

def classify(message: str) -> ClassificationResult:
    """
    Returns the best-matching intent, confidence score, and extracted entities.
    If confidence is < 0.60, forces intent to "general".
    """
    text = message.lower().strip()
    
    matched_intent = "general"
    confidence = 0.0
    
    # Calculate confidence based on number of matched keywords and their specificity
    for intent, patterns in _INTENT_PATTERNS:
        matches = 0
        for pattern in patterns:
            # Check for matches
            if re.search(pattern, text):
                matches += 1
                
        if matches > 0:
            # Basic heuristic: 1 match = 0.65, 2 matches = 0.85, 3+ = 0.95
            score = 0.65
            if matches == 2:
                score = 0.85
            elif matches >= 3:
                score = 0.95
                
            if score > confidence:
                confidence = score
                matched_intent = intent
                
    # If no matches found or very low confidence
    if confidence < 0.60:
        matched_intent = "general"
        confidence = 0.99  # We are highly confident it's a general question

    entities = extract_entities(text)

    return {
        "intent": matched_intent,
        "confidence": confidence,
        "entities": entities
    }
