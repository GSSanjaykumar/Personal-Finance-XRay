import re


class Normalizer:

    def normalize(self, description):

        description = self.to_upper(description)

        description = self.remove_special_characters(description)

        description = self.remove_extra_spaces(description)

        return description


    def to_upper(self, text):

        return text.upper()


    def remove_special_characters(self, text):

        text = re.sub(r"[^A-Z0-9 ]", " ", text)

        return text


    def remove_extra_spaces(self, text):

        return " ".join(text.split())