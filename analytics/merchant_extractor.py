from analytics.merchant_dictionary import MERCHANT_MAPPINGS

class MerchantExtractor:
    
    def extract(self, normalized_description: str) -> dict:
        """
        Extracts merchant details from the normalized description.
        Returns a dictionary with 'merchant_name' and 'category'.
        """
        for keyword, details in MERCHANT_MAPPINGS.items():
            if keyword in normalized_description:
                return {
                    "merchant_name": details["merchant_name"],
                    "category": details["category"]
                }
                
        return {
            "merchant_name": "Unknown Merchant",
            "category": "Others"
        }
