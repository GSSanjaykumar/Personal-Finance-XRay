import pdfplumber


class PDFParser:

    def read_pdf(self, pdf_path):

        with pdfplumber.open(pdf_path) as pdf:

            print("=" * 50)
            print("🏦 PDF Opened Successfully")
            print("=" * 50)

            print(f"Total Pages : {len(pdf.pages)}")

            print()

            for page_number, page in enumerate(pdf.pages, start=1):

                print("=" * 50)
                print(f"📄 PAGE {page_number}")
                print("=" * 50)

                text = page.extract_text()

                print(text)

                print()