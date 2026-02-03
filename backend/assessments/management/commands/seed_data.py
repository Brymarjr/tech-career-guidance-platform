from django.core.management.base import BaseCommand
from assessments.models import CareerPath, Milestone, LearningResource

class Command(BaseCommand):
    help = 'Seeds the database with RIASEC career paths, milestones, and resources'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting professional data seed...')

        # Unified Data Structure: Path -> Milestones -> Resources
        data = {
            'I': {
                'title': 'The Data & AI Path',
                'duration': '12 Weeks',
                'description': 'Deep dive into analytical and scientific logic.',
                'milestones': [
                    {
                        'title': 'Master Python & SQL',
                        'resources': [
                            {'title': 'Python for Data Science', 'url': 'https://realpython.com/learning-paths/data-science-python-fundamentals/', 'type': 'COURSE'},
                            {'title': 'SQLZoo Interactive', 'url': 'https://sqlzoo.net/', 'type': 'DOC'}
                        ]
                    },
                    {
                        'title': 'Learn Statistical Modeling',
                        'resources': [
                            {'title': 'Khan Academy Stats', 'url': 'https://www.khanacademy.org/math/statistics-probability', 'type': 'VIDEO'}
                        ]
                    }
                ]
            },
            'A': {
                'title': 'The Creative Tech Path',
                'duration': '8 Weeks',
                'description': 'Innovation and design through technical expression.',
                'milestones': [
                    {
                        'title': 'Visual Design Principles',
                        'resources': [
                            {'title': 'Laws of UX', 'url': 'https://lawsofux.com/', 'type': 'DOC'},
                            {'title': 'Google UX Course', 'url': 'https://grow.google/certificates/ux-design/', 'type': 'COURSE'}
                        ]
                    }
                ]
            },
            # Add others (R, S, E, C) following this same pattern
        }

        for trait_char, info in data.items():
            # 1. Create/Update Career Path
            path, _ = CareerPath.objects.update_or_create(
                trait_type=trait_char,
                defaults={
                    'title': info['title'],
                    'duration': info['duration'],
                    'description': info['description']
                }
            )

            # 2. Create Milestones
            for index, m_info in enumerate(info['milestones']):
                milestone, _ = Milestone.objects.update_or_create(
                    path=path,
                    title=m_info['title'],
                    defaults={'order': index}
                )

                # 3. Create Resources for this Milestone
                # Clear existing resources for this milestone to prevent duplicates on re-run
                milestone.resources.all().delete()
                for r_info in m_info['resources']:
                    LearningResource.objects.create(
                        milestone=milestone,
                        title=r_info['title'],
                        url=r_info['url'],
                        resource_type=r_info['type'],
                        trait_alignment=trait_char
                    )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all Career Paths, Milestones, and Resources!'))