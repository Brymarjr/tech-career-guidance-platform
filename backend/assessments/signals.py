from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserProgress, Achievement, UserAchievement

@receiver(post_save, sender=UserProgress)
def check_for_achievements(sender, instance, **kwargs):
    # Only trigger if the milestone was JUST marked as COMPLETED
    if instance.status == 'COMPLETED':
        print(f"DEBUG: Awarding badge to {instance.user.username}")
        user = instance.user
        
        # LOGIC 1: The "First Milestone" Badge
        first_step_badge, _ = Achievement.objects.get_or_create(
            title="First Step Taken",
            defaults={
                "description": "You've successfully completed your first roadmap milestone!",
                "badge_icon": "Award",
                "points": 50
            }
        )
        UserAchievement.objects.get_or_create(user=user, achievement=first_step_badge)

        # LOGIC 2: Path-Specific Badges (e.g., Infrastructure Specialist)
        # Check if they've completed 3 milestones in the same path
        completed_count = UserProgress.objects.filter(
            user=user, 
            status='COMPLETED', 
            milestone__path=instance.milestone.path
        ).count()

        if completed_count >= 3:
            specialist_badge, _ = Achievement.objects.get_or_create(
                title=f"{instance.milestone.path.title} Specialist",
                defaults={
                    "description": f"Mastered 3 core milestones in {instance.milestone.path.title}.",
                    "badge_icon": "ShieldCheck",
                    "points": 150
                }
            )
            UserAchievement.objects.get_or_create(user=user, achievement=specialist_badge)