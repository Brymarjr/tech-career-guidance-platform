class RIASECService:
    @staticmethod
    def calculate_scores(answers):
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
    
    @staticmethod
    def get_roadmap_data(trait):
        roadmaps = {
            'Investigative': {
                'title': 'The Data & AI Path',
                'duration': '12 Weeks',
                'roles': ['Data Scientist', 'AI Researcher', 'Cybersecurity Analyst'],
                'milestones': ['Master Python & SQL', 'Learn Statistical Modeling', 'Deep Learning Basics']
            },
            'Realistic': {
                'title': 'The Infrastructure Path',
                'duration': '10 Weeks',
                'roles': ['DevOps Engineer', 'Cloud Architect', 'Network Security'],
                'milestones': ['Linux Administration', 'Docker & Kubernetes', 'AWS/Azure Foundations']
            },
            'Artistic': {
                'title': 'The Creative Tech Path',
                'duration': '8 Weeks',
                'roles': ['UI/UX Designer', 'Frontend Architect', 'Product Designer'],
                'milestones': ['Visual Design Principles', 'Advanced React/Next.js', 'User Research']
            },
            'Social': {
                'title': 'The Tech Leadership Path',
                'duration': '6 Weeks',
                'roles': ['Technical Program Manager', 'Scrum Master', 'IT Consultant'],
                'milestones': ['Agile Methodologies', 'Stakeholder Management', 'Public Speaking for Tech']
            },
            'Enterprising': {
                'title': 'The Tech Entrepreneur Path',
                'duration': '8 Weeks',
                'roles': ['Product Manager', 'Tech Founder', 'Sales Engineer'],
                'milestones': ['Market Research', 'MVP Development', 'Venture Capital Basics']
            },
            'Conventional': {
                'title': 'The Systems & Quality Path',
                'duration': '6 Weeks',
                'roles': ['QA Engineer', 'Database Administrator', 'Compliance Officer'],
                'milestones': ['Automated Testing', 'Database Optimization', 'Security Compliance']
            }
        }

        # COMPREHENSIVE RESOURCE MAPPING
        resource_map = {
            # Investigative
            'Master Python & SQL': [
                {'name': 'Python for Data Science (Real Python)', 'url': 'https://realpython.com/learning-paths/data-science-python-fundamentals/'},
                {'name': 'SQLZoo Interactive Tutorials', 'url': 'https://sqlzoo.net/'},
                {'name': 'Mode Analytics SQL School', 'url': 'https://mode.com/sql-tutorial/'}
            ],
            'Learn Statistical Modeling': [
                {'name': 'Khan Academy Statistics', 'url': 'https://www.khanacademy.org/math/statistics-probability'},
                {'name': 'Penn State Stat 500', 'url': 'https://online.stat.psu.edu/stat500/'}
            ],
            'Deep Learning Basics': [
                {'name': 'Fast.ai Deep Learning Course', 'url': 'https://www.fast.ai/'},
                {'name': 'DeepLearning.AI (Andrew Ng)', 'url': 'https://www.deeplearning.ai/'}
            ],

            # Realistic
            'Linux Administration': [
                {'name': 'The Linux Command Line', 'url': 'https://linuxcommand.org/'},
                {'name': 'Linux Journey', 'url': 'https://linuxjourney.com/'}
            ],
            'Docker & Kubernetes': [
                {'name': 'Docker Curriculum', 'url': 'https://docker-curriculum.com/'},
                {'name': 'Kubernetes Basics', 'url': 'https://kubernetes.io/docs/tutorials/kubernetes-basics/'}
            ],
            'AWS/Azure Foundations': [
                {'name': 'AWS Cloud Practitioner Essentials', 'url': 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/'},
                {'name': 'Azure Fundamentals (MS Learn)', 'url': 'https://learn.microsoft.com/en-us/training/paths/az-900-fundamentals-conceptual/'}
            ],

            # Artistic
            'Visual Design Principles': [
                {'name': 'Laws of UX', 'url': 'https://lawsofux.com/'},
                {'name': 'Google UX Design Professional', 'url': 'https://grow.google/certificates/ux-design/'}
            ],
            'Advanced React/Next.js': [
                {'name': 'Next.js Official Documentation', 'url': 'https://nextjs.org/docs'},
                {'name': 'Epic React by Kent C. Dodds', 'url': 'https://epicreact.dev/'}
            ],
            'User Research': [
                {'name': 'Nielsen Norman Group Articles', 'url': 'https://www.nngroup.com/articles/'},
                {'name': 'Usability.gov Methods', 'url': 'https://www.usability.gov/how-to-and-tools/methods/index.html'}
            ],

            # Social
            'Agile Methodologies': [
                {'name': 'Atlassian Agile Guide', 'url': 'https://www.atlassian.com/agile'},
                {'name': 'Scrum.org Resources', 'url': 'https://www.scrum.org/resources/what-is-scrum'}
            ],
            'Stakeholder Management': [
                {'name': 'MindTools: Stakeholder Analysis', 'url': 'https://www.mindtools.com/pages/article/newPPM_07.htm'}
            ],
            'Public Speaking for Tech': [
                {'name': 'Harvard: Public Speaking Resources', 'url': 'https://extension.harvard.edu/blog/10-tips-for-improving-your-public-speaking-skills/'}
            ],

            # Enterprising
            'Market Research': [
                {'name': 'Y-Combinator Startup Library', 'url': 'https://www.ycombinator.com/library'},
                {'name': 'Statista Market Data', 'url': 'https://www.statista.com/'}
            ],
            'MVP Development': [
                {'name': 'The Lean Startup Methodology', 'url': 'http://theleanstartup.com/principles'}
            ],
            'Venture Capital Basics': [
                {'name': 'NVCA Resources', 'url': 'https://nvca.org/'},
                {'name': 'Andreessen Horowitz (a16z) Blog', 'url': 'https://a16z.com/'}
            ],

            # Conventional
            'Automated Testing': [
                {'name': 'Cypress Testing Docs', 'url': 'https://docs.cypress.io/'},
                {'name': 'Selenium Academy', 'url': 'https://www.selenium.dev/documentation/'}
            ],
            'Database Optimization': [
                {'name': 'Use The Index, Luke (SQL Performance)', 'url': 'https://use-the-index-luke.com/'},
                {'name': 'PostgreSQL Performance Wiki', 'url': 'https://wiki.postgresql.org/wiki/Performance_Optimization'}
            ],
            'Security Compliance': [
                {'name': 'OWASP Top Ten', 'url': 'https://owasp.org/www-project-top-ten/'},
                {'name': 'NIST Cybersecurity Framework', 'url': 'https://www.nist.gov/cyberframework'}
            ]
        }
        
        data = roadmaps.get(trait, roadmaps['Investigative']).copy()
        data['milestone_details'] = [
            {'title': m, 'resources': resource_map.get(m, [])} for m in data['milestones']
        ]
        return data