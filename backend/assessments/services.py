class RIASECService:
    @staticmethod
    def calculate_scores(answers):
        """
        Expects answers in format: [{"type": "R", "value": 1}, {"type": "I", "value": 0}, ...]
        Returns a dictionary of totals and the top trait name.
        """
        totals = {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
        
        for answer in answers:
            r_type = answer.get('type')
            value = answer.get('value', 0)
            if r_type in totals:
                totals[r_type] += value

        # Map types to full names for the 'top_trait' field
        mapping = {
            'R': 'Realistic', 'I': 'Investigative', 'A': 'Artistic',
            'S': 'Social', 'E': 'Enterprising', 'C': 'Conventional'
        }
        
        top_type = max(totals, key=totals.get)
        return totals, mapping[top_type]