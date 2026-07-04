from intelligence.merchant_database import MerchantDatabase


class Matcher:

    def __init__(self):

        self.database = MerchantDatabase()


    def match(self, normalized_text):

        merchants = self.database.get_all_merchants()

        for _, row in merchants.iterrows():

            keyword = row["keywords"]

            if keyword in normalized_text:

                return {

                    "merchant_name": row["merchant_name"],

                    "category": row["category"],

                    "keyword": row["keywords"]

                }
        return {

        "merchant_name": "Unknown Merchant",

        "category": "Others",

        "keyword": None

    }