from parsers.noise_rules import NOISE_WORDS


class MerchantCleaner:

    def clean(self, description):

        description = description.upper()

        for word in NOISE_WORDS:

            description = description.replace(word, " ")

        return description.strip()