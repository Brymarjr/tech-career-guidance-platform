import httpx
from openai import OpenAI
from django.conf import settings

class CareerMentorService:
    @staticmethod
    def get_response(user, user_message, chat_history, roadmap_data):
        """
        Generates a high-fidelity mentorship response using Groq (Llama 3.3 70B).
        This service uses a persona-driven system prompt to ensure the advice
        is specific to the student's RIASEC trait and Nigerian tech context.
        """
        # 1. Configuration: Pulling Groq settings from settings.py
        # .strip() is added here to ensure no hidden spaces cause 401 errors
        api_key = getattr(settings, "OPENAI_API_KEY", "").strip()
        base_url = getattr(settings, "OPENAI_BASE_URL", "https://api.groq.com/openai/v1").strip()
        
        if not api_key:
            raise ValueError("AI API Key (Groq) not found in settings.")

        # 2. Resilient Connection: Using verified httpx configuration for Nigerian networks
        # proxy=None and timeout=60.0 ensure stability on unstable connections
        http_client = httpx.Client(proxy=None, timeout=60.0)
        
        client = OpenAI(
            api_key=api_key, 
            base_url=base_url,
            http_client=http_client
        )
        
        # 3. Context Extraction
        result = user.assessmentresult_set.first()
        top_trait = result.top_trait if result else "General Tech"
        path_title = roadmap_data.get('title', 'Exploration')
        milestones = [m['title'] for m in roadmap_data.get('milestones', [])]
        next_milestone = milestones[0] if milestones else "Next Level"
        
        # 4. POWERFUL PERSONA-DRIVEN SYSTEM PROMPT
        system_prompt = f"""
        ROLE: You are 'ForeTrack AI', an elite Tech Career Architect and Mentor.
        MISSION: Guide students in Nigeria to achieve global tech excellence using their RIASEC traits.

        STUDENT PROFILE:
        - Identified Trait: {top_trait}
        - Current Career Path: {path_title}
        - Active Roadmap Milestones: {", ".join(milestones)}

        BEHAVIORAL GUIDELINES:
        1. PSYCHOLOGICAL ALIGNMENT: Tailor your advice to the '{top_trait}' mindset.
           - 'Investigative': Focus on logic, research, deep-diving into documentation, and data-driven decisions.
           - 'Artistic': Focus on UI/UX, expressive code, motion design, and creative problem solving.
           - 'Social': Focus on team dynamics, open-source contribution, soft skills, and community mentorship.
           - 'Realistic': Focus on hands-on technical execution, hardware, networking, and physical system architecture.
           - 'Enterprising': Focus on business value, technical sales, startup ideation, and leadership.
           - 'Conventional': Focus on security auditing, database integrity, QA, and strict adherence to protocols.

        2. ROADMAP INTEGRITY: Always try to relate your advice back to the next milestone: '{next_milestone}'. Provide actionable steps to clear this hurdle.
        3. NIGERIAN CONTEXT: Where relevant, mention local tech hubs (like Yaba/Lekki in Lagos), Nigerian tech startups, or specific remote work strategies for Nigerian developers.
        4. TONE: Calm, confident, authoritative yet empathetic. Act as a high-level consultant.
        5. FORMATTING: Use Markdown. **Bold** key terms for emphasis. Use code blocks (```) for technical commands or code snippets.
        """

        # 5. Build Message History
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (limited to last 10 for performance)
        for msg in chat_history:
            messages.append({"role": msg.role, "content": msg.content})
            
        # Add the current user query
        messages.append({"role": "user", "content": user_message})

        # 6. Execution via Groq (Llama 3.3 70B)
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile", 
                messages=messages,
                temperature=0.6,  # Balanced for creativity and factual precision
                max_tokens=1024,
                top_p=0.9
            )
            return response.choices[0].message.content
            
        except Exception as e:
            # Re-raising for the view to handle with the 'OpenAI Quota' fallback message
            print(f"ForeTrack AI Service Error: {e}")
            raise e