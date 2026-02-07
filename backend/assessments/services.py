class RIASECService:
    @staticmethod
    def calculate_scores(answers):
        """
        Pure logic to calculate totals and identify top 2 traits.
        """
        totals = {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
        for answer in answers:
            r_type = answer.get('type')
            value = answer.get('value', 0)
            if r_type in totals:
                totals[r_type] += value

        # Sort traits by value descending: [('I', 25), ('R', 20), ...]
        sorted_scores = sorted(totals.items(), key=lambda item: item[1], reverse=True)
        
        primary_char = sorted_scores[0][0]
        secondary_char = sorted_scores[1][0]
        
        # Combined code (e.g., "IR", "AI", "SE")
        blended_code = f"{primary_char}{secondary_char}"
        
        mapping = {
            'R': 'Realistic', 'I': 'Investigative', 'A': 'Artistic',
            'S': 'Social', 'E': 'Enterprising', 'C': 'Conventional'
        }
        
        # We return the primary trait name for display, and the blended_code for routing
        return totals, mapping[primary_char], blended_code