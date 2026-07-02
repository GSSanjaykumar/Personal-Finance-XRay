import pdfplumber
from parsers.header_mapper import HeaderMapper
from parsers.transaction_converter import TransactionConverter

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

                tables = page.extract_tables()

                print(f"📊 Tables Found : {len(tables)}")

                print()

                for table_number, table in enumerate(tables, start=1):

                    print("=" * 50)
                    print(f"📋 TABLE {table_number}")
                    print("=" * 50)

                    header = table[0]

                    mapper = HeaderMapper()

                    column_map = mapper.create_mapping(header)

                    print("🗺️ Column Mapping")
                    print(column_map)
                    print()

                    converter = TransactionConverter()

                for row in table[1:]:

                    debit = row[column_map["Debit"]]
                    credit = row[column_map["Credit"]]

                    # Skip rows that are not transactions
                    if debit == "" and credit == "":
                        continue

                    transaction = converter.convert(
                        row,
                        column_map
                    )

                    print(transaction)

                    print()

                print()