from django.contrib import admin
from .models import CareerPath, Milestone, UserProgress, Question, AssessmentResult, LearningResource

# 1. Allow resources to be edited inside the Milestone page
class LearningResourceInline(admin.TabularInline):
    model = LearningResource
    extra = 1

# 2. Allow milestones to be edited inside the CareerPath page
class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 1

@admin.register(CareerPath)
class CareerPathAdmin(admin.ModelAdmin):
    # Display the trait code (e.g. 'AI') and the friendly title
    list_display = ('trait_type', 'title', 'duration')
    list_filter = ('trait_type',)
    search_fields = ('title', 'description')
    inlines = [MilestoneInline]

@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ('title', 'path', 'order')
    list_filter = ('path',)
    search_fields = ('title',)
    inlines = [LearningResourceInline]

@admin.register(LearningResource)
class LearningResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'milestone', 'resource_type', 'category')
    list_filter = ('resource_type', 'category', 'trait_alignment')
    search_fields = ('title', 'url')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'riasec_type', 'order')
    list_filter = ('riasec_type',)
    ordering = ('order',)
    search_fields = ('text',)

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'milestone', 'is_completed', 'completed_at')
    list_filter = ('is_completed', 'milestone__path', 'user')
    date_hierarchy = 'completed_at'

@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    # Shows the blended code (e.g. "IR") in the admin list
    list_display = ('user', 'top_trait', 'created_at')
    list_filter = ('top_trait', 'created_at')
    readonly_fields = ('created_at',)