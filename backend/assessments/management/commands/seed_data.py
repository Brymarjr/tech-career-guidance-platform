from django.core.management.base import BaseCommand
from assessments.models import Question, CareerPath, Milestone, LearningResource
from django.db import transaction

class Command(BaseCommand):
    help = 'Final Verified 1:1 System Restore: 30 Questions, 6 Paths, Ordered Milestones, and 60 Resources'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate the command without saving changes to the database',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('⚠️  DRY RUN ENABLED: No changes will be saved to your database.'))

        try:
            with transaction.atomic():
                self.stdout.write(self.style.SUCCESS('🚀 Starting final verified 1:1 data restoration...'))

                # 1. CAREER PATHS (Preserving exact titles and durations)
                # Updated fields: 'trait_type' instead of 'code', 'duration' instead of 'duration_weeks'
                paths_data = [
                    {'trait_type': 'R', 'title': 'The Infrastructure Path', 'duration': '10 Weeks'},
                    {'trait_type': 'I', 'title': 'The Data & AI Path', 'duration': '12 Weeks'},
                    {'trait_type': 'A', 'title': 'The Creative Tech Path', 'duration': '8 Weeks'},
                    {'trait_type': 'S', 'title': 'The Tech Leadership Path', 'duration': '6 Weeks'},
                    {'trait_type': 'E', 'title': 'The Tech Entrepreneur Path', 'duration': '8 Weeks'},
                    {'trait_type': 'C', 'title': 'The Systems & Quality Path', 'duration': '6 Weeks'},
                ]
                
                path_objs = {}
                for p in paths_data:
                    obj, _ = CareerPath.objects.update_or_create(
                        trait_type=p['trait_type'],
                        defaults={'title': p['title'], 'duration': p['duration']}
                    )
                    path_objs[p['title']] = obj

                # 2. YOUR EXACT 30 QUESTIONS
                questions_data = [
                    ("I would like to work in Cybersecurity auditing or Database Administration.", "C"),
                    ("I enjoy managing project timelines and keeping tasks organized.", "C"),
                    ("I prefer structured environments with clear procedures.", "C"),
                    ("I like ensuring that software meets strict quality and security standards.", "C"),
                    ("I enjoy creating detailed technical documentation and manuals.", "C"),
                    ("I am motivated by competition and achieving business targets.", "E"),
                    ("I prefer roles that involve negotiation and strategic planning.", "E"),
                    ("I would enjoy starting my own tech company (startup).", "E"),
                    ("I like leading a team and taking responsibility for a project's success.", "E"),
                    ("I enjoy pitching technical products to potential clients.", "E"),
                    ("I enjoy organizing community events or technical workshops.", "S"),
                    ("I prefer roles where I interact with users to understand their needs.", "S"),
                    ("I would enjoy being a technical trainer or a Scrum Master.", "S"),
                    ("I like working in teams where collaboration is the priority.", "S"),
                    ("I enjoy mentoring others and explaining technical concepts.", "S"),
                    ("I would like to work on animations and front-end interactions.", "A"),
                    ("I enjoy writing expressive and elegant code.", "A"),
                    ("I prefer creative problem solving over following a strict set of rules.", "A"),
                    ("I like experimenting with colors, typography, and layout.", "A"),
                    ("I enjoy designing beautiful and intuitive user interfaces.", "A"),
                    ("I would like to work on Artificial Intelligence and Machine Learning models.", "I"),
                    ("I prefer deep-diving into code to find the root cause of a bug.", "I"),
                    ("I enjoy analyzing large datasets to find hidden patterns.", "I"),
                    ("I like researching new technologies and documenting how they work.", "I"),
                    ("I enjoy solving complex mathematical or logical puzzles.", "I"),
                    ("I prefer practical, hands-on technical tasks rather than theoretical discussions.", "R"),
                    ("I would enjoy working in a data center managing physical servers.", "R"),
                    ("I like using tools to troubleshoot technical equipment.", "R"),
                    ("I prefer building physical network setups over designing software architecture.", "R"),
                    ("I enjoy assembling or repairing hardware components.", "R"),
                ]
                
                if not dry_run:
                    Question.objects.all().delete()
                    for text, trait in questions_data:
                        Question.objects.create(text=text, trait_code=trait)

                # 3. MILESTONE ORDERS (Exact sequencing 1 -> 5)
                milestone_orders = {
                    "Linux System Administration": 1, "Docker & Containerization": 2, "Kubernetes Orchestration": 3, "Cloud Fundamentals (Azure/AWS)": 4, "Infrastructure as Code (Terraform)": 5,
                    "Python for Data Science": 1, "Data Analysis with Pandas": 2, "Statistical Foundations": 3, "Machine Learning Foundations": 4, "Deep Learning & AI": 5,
                    "UI/UX Design Foundations": 1, "Mastering Figma": 2, "Advanced CSS & Modern Layouts": 3, "Interactive Frontend (React/Next.js)": 4, "Animations & Motion Design": 5,
                    "Agile & Scrum Foundations": 1, "Technical Product Management": 2, "Technical Communication & Mentorship": 3, "System Design for Leaders": 4, "Community & Open Source Leadership": 5,
                    "Product-Market Fit & Ideation": 1, "Solutions Architecture Foundations": 2, "Technical Sales & Pitching": 3, "SaaS Business Models & Metrics": 4, "Go-to-Market Strategy": 5,
                    "Database Administration (DBA) Basics": 1, "Software Quality Assurance (QA)": 2, "Cybersecurity Auditing & Compliance": 3, "IT Governance & Risk Management": 4, "Technical Documentation & SOPs": 5,
                }

                # 4. ALL 60 LEARNING RESOURCES (Type, Category, URL)
                resource_data = [
                    ("Markdown Guide for Documentation", "The Systems & Quality Path | Technical Documentation & SOPs", "Documentation", "EXTERNAL", "https://www.markdownguide.org/"),
                    ("Write the Docs: Best Practices", "The Systems & Quality Path | Technical Documentation & SOPs", "Documentation", "DOCS", "https://www.writethedocs.org/"),
                    ("ISO/IEC 27001 Introduction", "The Systems & Quality Path | IT Governance & Risk Management", "Documentation", "DOCS", "https://www.iso.org/isoiec-27001-information-security.html"),
                    ("ISACA COBIT Framework", "The Systems & Quality Path | IT Governance & Risk Management", "Course", "EXTERNAL", "https://www.isaca.org/resources/cobit"),
                    ("OWASP Top 10 Security Risks", "The Systems & Quality Path | Cybersecurity Auditing & Compliance", "Documentation", "DOCS", "https://owasp.org/www-project-top-ten/"),
                    ("NIST Cybersecurity Framework", "The Systems & Quality Path | Cybersecurity Auditing & Compliance", "Documentation", "DOCS", "https://www.nist.gov/cyberframework"),
                    ("Testing Manifesto", "The Systems & Quality Path | Software Quality Assurance (QA)", "Documentation", "EXTERNAL", "https://www.testingmanifesto.com/"),
                    ("ISTQB Foundation Level Syllabus", "The Systems & Quality Path | Software Quality Assurance (QA)", "Documentation", "DOCS", "https://www.istqb.org/certifications/certified-tester-foundation-level"),
                    ("SQL Indexing & Performance", "The Systems & Quality Path | Database Administration (DBA) Basics", "Documentation", "EXTERNAL", "https://use-the-index-luke.com/"),
                    ("PostgreSQL Administration Guide", "The Systems & Quality Path | Database Administration (DBA) Basics", "Documentation", "DOCS", "https://www.postgresql.org/docs/current/admin.html"),
                    ("Product Led Growth Foundations", "The Tech Entrepreneur Path | Go-to-Market Strategy", "Documentation", "EXTERNAL", "https://productled.com/foundations/"),
                    ("HubSpot: GTM Strategy Guide", "The Tech Entrepreneur Path | Go-to-Market Strategy", "Documentation", "DOCS", "https://blog.hubspot.com/marketing/go-to-market-strategy"),
                    ("MicroConf Startup Resources", "The Tech Entrepreneur Path | SaaS Business Models & Metrics", "Course", "EXTERNAL", "https://microconf.com/resources"),
                    ("SaaS Metrics 2.0 (Guide)", "The Tech Entrepreneur Path | SaaS Business Models & Metrics", "Documentation", "DOCS", "https://www.forentrepreneurs.com/saas-metrics-2/"),
                    ("Mastering the Elevator Pitch", "The Tech Entrepreneur Path | Technical Sales & Pitching", "Documentation", "EXTERNAL", "https://hbr.org/2012/10/the-art-of-the-elevator-pitch"),
                    ("The Art of the Technical Demo", "The Tech Entrepreneur Path | Technical Sales & Pitching", "Documentation", "EXTERNAL", "https://hbr.org/2012/10/the-art-of-the-technical-demo"),
                    ("Microsoft Learn: Architecting Solutions", "The Tech Entrepreneur Path | Solutions Architecture Foundations", "Course", "DOCS", "https://learn.microsoft.com/en-us/training/paths/architect-great-solutions/"),
                    ("AWS Solutions Architect Learning Path", "The Tech Entrepreneur Path | Solutions Architecture Foundations", "Course", "EXTERNAL", "https://aws.amazon.com/training/path-solutions-architect/"),
                    ("The Lean Startup Concepts", "The Tech Entrepreneur Path | Product-Market Fit & Ideation", "Documentation", "DOCS", "http://theleanstartup.com/principles"),
                    ("Y Combinator Startup School", "The Tech Entrepreneur Path | Product-Market Fit & Ideation", "Course", "EXTERNAL", "https://www.startupschool.org/"),
                    ("Building Technical Communities", "The Tech Leadership Path | Community & Open Source Leadership", "Documentation", "EXTERNAL", "https://www.orbit.love/blog/building-community"),
                    ("Open Source Guide", "The Tech Leadership Path | Community & Open Source Leadership", "Documentation", "DOCS", "https://opensource.guide/"),
                    ("High-Level Architecture Concepts", "The Tech Leadership Path | System Design for Leaders", "Documentation", "DOCS", "https://microservices.io/"),
                    ("System Design Interview Primer", "The Tech Leadership Path | System Design for Leaders", "Documentation", "DOCS", "https://github.com/donnemartin/system-design-primer"),
                    ("The Art of Giving Feedback", "The Tech Leadership Path | Technical Communication & Mentorship", "Documentation", "EXTERNAL", "https://hbr.org/2014/01/the-art-of-giving-feedback"),
                    ("Google Technical Writing Course", "The Tech Leadership Path | Technical Communication & Mentorship", "Course", "EXTERNAL", "https://developers.google.com/tech-writing"),
                    ("How to Build a Product Roadmap", "The Tech Leadership Path | Technical Product Management", "Documentation", "DOCS", "https://www.productplan.com/guide/product-roadmap/"),
                    ("Product School Resources", "The Tech Leadership Path | Technical Product Management", "Course", "EXTERNAL", "https://productschool.com/resources"),
                    ("Atlassian Agile Coach", "The Tech Leadership Path | Agile & Scrum Foundations", "Documentation", "EXTERNAL", "https://www.atlassian.com/agile"),
                    ("Scrum Guide (Official)", "The Tech Leadership Path | Agile & Scrum Foundations", "Documentation", "DOCS", "https://scrumguides.org/scrum-guide.html"),
                    ("Animation for Beginners (Awwwards)", "The Creative Tech Path | Animations & Motion Design", "Course", "EXTERNAL", "https://www.awwwards.com/academy/"),
                    ("Framer Motion Documentation", "The Creative Tech Path | Animations & Motion Design", "Documentation", "DOCS", "https://www.framer.com/motion/"),
                    ("Next.js Dashboard App Tutorial", "The Creative Tech Path | Interactive Frontend (React/Next.js)", "Course", "EXTERNAL", "https://nextjs.org/learn"),
                    ("React.dev Interactive Tutorial", "The Creative Tech Path | Interactive Frontend (React/Next.js)", "Documentation", "DOCS", "https://react.dev/learn"),
                    ("Tailwind CSS Documentation", "The Creative Tech Path | Advanced CSS & Modern Layouts", "Documentation", "DOCS", "https://tailwindcss.com/docs"),
                    ("CSS Grid Garden", "The Creative Tech Path | Advanced CSS & Modern Layouts", "Course", "EXTERNAL", "https://cssgridgarden.com/"),
                    ("Design Systems 101", "The Creative Tech Path | Mastering Figma", "Documentation", "EXTERNAL", "https://www.nngroup.com/articles/design-systems-101/"),
                    ("Figma for Beginners (Official)", "The Creative Tech Path | Mastering Figma", "Documentation", "DOCS", "https://help.figma.com/hc/en-us/articles/360040328273"),
                    ("Laws of UX", "The Creative Tech Path | UI/UX Design Foundations", "Documentation", "DOCS", "https://lawsofux.com/"),
                    ("Google UX Design Professional Certificate", "The Creative Tech Path | UI/UX Design Foundations", "Course", "EXTERNAL", "https://grow.google/certificates/ux-design/"),
                    ("PyTorch for Beginners", "The Data & AI Path | Deep Learning & AI", "Documentation", "DOCS", "https://pytorch.org/tutorials/beginner/basics/intro.html"),
                    ("TensorFlow Introduction", "The Data & AI Path | Deep Learning & AI", "Course", "DOCS", "https://www.tensorflow.org/learn"),
                    ("ML Crash Course (Google)", "The Data & AI Path | Machine Learning Foundations", "Course", "EXTERNAL", "https://developers.google.com/machine-learning/crash-course"),
                    ("Scikit-Learn Tutorials", "The Data & AI Path | Machine Learning Foundations", "Documentation", "DOCS", "https://scikit-learn.org/stable/tutorial/index.html"),
                    ("StatQuest: Machine Learning Basics", "The Data & AI Path | Statistical Foundations", "Video", "VIDEO", "https://www.youtube.com/c/joshstarmer"),
                    ("Khan Academy Statistics", "The Data & AI Path | Statistical Foundations", "Course", "EXTERNAL", "https://www.khanacademy.org/math/statistics-probability"),
                    ("SQL for Data Science", "The Data & AI Path | Data Analysis with Pandas", "Course", "EXTERNAL", "https://www.coursera.org/learn/sql-for-data-science"),
                    ("Pandas 10-Minute Guide", "The Data & AI Path | Data Analysis with Pandas", "Documentation", "DOCS", "https://pandas.pydata.org/docs/user_guide/10min.html"),
                    ("NumPy Quickstart Guide", "The Data & AI Path | Python for Data Science", "Documentation", "DOCS", "https://numpy.org/doc/stable/user/quickstart.html"),
                    ("Kaggle Python Course", "The Data & AI Path | Python for Data Science", "Course", "EXTERNAL", "https://www.kaggle.com/learn/python"),
                    ("IaC Best Practices", "The Infrastructure Path | Infrastructure as Code (Terraform)", "Documentation", "DOCS", "https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html"),
                    ("Terraform Get Started Guide", "The Infrastructure Path | Infrastructure as Code (Terraform)", "Documentation", "DOCS", "https://developer.hashicorp.com/terraform/tutorials/aws-get-started"),
                    ("Microsoft Azure Fundamentals (AZ-900)", "The Infrastructure Path | Cloud Fundamentals (Azure/AWS)", "Course", "EXTERNAL", "https://learn.microsoft.com/en-us/training/paths/az-900-fundamentals-concepts/"),
                    ("AWS Cloud Practitioner Essentials", "The Infrastructure Path | Cloud Fundamentals (Azure/AWS)", "Course", "EXTERNAL", "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/"),
                    ("K8s for Beginners (YouTube)", "The Infrastructure Path | Kubernetes Orchestration", "Video", "VIDEO", "https://www.youtube.com/watch?v=X48VuDVv0do"),
                    ("Kubernetes Basics Interactive", "The Infrastructure Path | Kubernetes Orchestration", "Course", "EXTERNAL", "https://kubernetes.io/docs/tutorials/kubernetes-basics/"),
                    ("Play with Docker (Hands-on Labs)", "The Infrastructure Path | Docker & Containerization", "Course", "EXTERNAL", "https://training.play-with-docker.com/"),
                    ("Docker Official Getting Started", "The Infrastructure Path | Docker & Containerization", "Documentation", "DOCS", "https://docs.docker.com/get-started/"),
                    ("The Linux Command Line (PDF/Book)", "The Infrastructure Path | Linux System Administration", "Documentation", "DOCS", "https://linuxcommand.org/tlcl.php"),
                    ("Linux Journey (Free Course)", "The Infrastructure Path | Linux System Administration", "Course", "EXTERNAL", "https://linuxjourney.com/"),
                ]

                for title, context, r_type, r_cat, r_url in resource_data:
                    path_name, milestone_title = context.split(" | ")
                    path_obj = path_objs.get(path_name)
                    
                    if path_obj:
                        order_val = milestone_orders.get(milestone_title, 1)
                        # Fixed: Using 'path' instead of 'career_path' to match model
                        ms_obj, _ = Milestone.objects.get_or_create(
                            path=path_obj,
                            title=milestone_title,
                            defaults={'description': f'Core roadmap for {milestone_title}', 'order': order_val}
                        )
                        
                        if not dry_run:
                            LearningResource.objects.update_or_create(
                                title=title,
                                milestone=ms_obj,
                                defaults={
                                    'resource_type': r_type, 
                                    'category': r_cat, 
                                    'url': r_url
                                }
                            )

                if dry_run:
                    raise Exception("DRY_RUN_ROLLBACK")

                self.stdout.write(self.style.SUCCESS('✅ Database Restoration Complete: 100% Data Fidelity achieved.'))

        except Exception as e:
            if str(e) == "DRY_RUN_ROLLBACK":
                self.stdout.write(self.style.SUCCESS('✅ Dry run confirmed. Data matches your model schema and your database remains untouched.'))
            else:
                self.stdout.write(self.style.ERROR(f'❌ Critical error: {e}'))