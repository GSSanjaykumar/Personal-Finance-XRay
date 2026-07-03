from parsers.pdf_parser import PDFParser

from intelligence.normalizer import Normalizer
from intelligence.matcher import Matcher


def main():

    # -----------------------------------------
    # Test the Intelligence Layer
    # -----------------------------------------

    text = "UPI/SWIGGY/swiggy@ybl"

    normalizer = Normalizer()
    matcher = Matcher()

    normalized = normalizer.normalize(text)
    merchant = matcher.match(normalized)

    print("=" * 50)
    print("🧪 Intelligence Layer Test")
    print("=" * 50)

    print(f"Original     : {text}")
    print(f"Normalized   : {normalized}")
    print(f"Merchant     : {merchant}")

    print()

    # -----------------------------------------
    # Test the PDF Parser
    # -----------------------------------------

    parser = PDFParser()

    parser.read_pdf(
        "datasets/sample_statements/hdfc_sample.pdf"
    )


if __name__ == "__main__":
    main()