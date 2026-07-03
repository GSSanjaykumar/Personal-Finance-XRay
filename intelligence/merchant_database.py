import pandas as pd


class MerchantDatabase:

    def __init__(self):

        self.database = pd.read_csv(
            "datasets/merchant_db/merchants.csv"
        )


    def get_all_merchants(self):

        return self.database