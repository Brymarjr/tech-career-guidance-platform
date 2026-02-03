class RIASECService:
    @staticmethod
    def calculate_scores(answers):
        """
        Pure logic to calculate totals from assessment answers.
        """
        totals = {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
        for answer in answers:
            r_type = answer.get('type')
            value = answer.get('value', 0)
            if r_type in totals:
                totals[r_type] += value

        mapping = {
            'R': 'Realistic', 'I': 'Investigative', 'A': 'Artistic',
            'S': 'Social', 'E': 'Enterprising', 'C': 'Conventional'
        }
        top_type = max(totals, key=totals.get)
        return totals, mapping[top_type]