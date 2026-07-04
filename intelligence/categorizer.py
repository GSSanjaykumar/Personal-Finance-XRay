class Categorizer:

    def __init__(self):

        self.category_rules = {

            "Food": [
                "Swiggy",
                "Zomato",
                "Dominos",
                "Pizza Hut",
                "KFC",
                "McDonalds"
            ],

            "Transport": [
                "Uber",
                "Ola",
                "Rapido"
            ],

            "Shopping": [
                "Amazon",
                "Flipkart",
                "Myntra"
            ],

            "Banking": [
                "ATM Withdrawal",
                "Interest"
            ],

            "Income": [
                "Salary"
            ]
        }

    def categorize(self, merchant_name):

        for category, merchants in self.category_rules.items():

            if merchant_name in merchants:
                return category

        return "Others"