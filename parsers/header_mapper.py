class HeaderMapper:

    def create_mapping(self, header):

        column_map = {}

        for index, column_name in enumerate(header):

            column_map[column_name.strip()] = index

        return column_map