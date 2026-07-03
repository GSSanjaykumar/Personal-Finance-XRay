from parsers.pdf_parser import PDFParser


def main():

    parser = PDFParser()

    parser.read_pdf(
        "datasets/sample_statements/hdfc_sample.pdf"
    )


if __name__ == "__main__":
    main()