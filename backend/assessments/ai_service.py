from openai import OpenAI
from django.conf import settings

class CareerMentorService:
    @staticmethod
    def get_response(user, user_message, chat_history, roadmap_data):
        # Professional practice: ensure key exists
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            raise ValueError("OpenAI API Key not found in settings.")

        client = OpenAI(api_key=api_key)
        
        # Safe extraction of trait to prevent 500 errors
        result = user.assessmentresult_set.first()
        top_trait = result.top_trait if result else "General Tech"
        
        # Context from roadmap
        path_title = roadmap_data.get('title', 'Exploration')
        milestones = [m['title'] for m in roadmap_data.get('milestones', [])]

        system_prompt = f"""
        You are an expert Tech Career Mentor. 
        User Trait: {top_trait}.
        Career Path: {path_title}.
        Target Milestones: {", ".join(milestones)}.
        
        Provide highly specific advice. If the user is an 'Investigative' type, focus on deep-learning and logic. 
        If 'Artistic', focus on UI/UX and creativity. Use Markdown for code blocks.
        """

        messages = [{"role": "system", "content": system_prompt}]
        for msg in chat_history:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7
        )
        
        return response.choices[0].message.content