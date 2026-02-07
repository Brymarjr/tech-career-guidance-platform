from django.apps import AppConfig

class AssessmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'assessments'

    def ready(self):
        # This line is the magic. It imports the signals when the app starts.
        import assessments.signals