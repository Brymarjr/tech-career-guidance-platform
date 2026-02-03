from django.contrib import admin
from .models import Question, AssessmentResult

@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    # This makes the list view much more useful
    list_display = ('user', 'top_trait', 'created_at')
    list_filter = ('top_trait', 'created_at')
    search_fields = ('user__email', 'user__username', 'top_trait')
    
    # This allows you to edit the JSON scores and Trait directly in the admin
    fields = ('user', 'top_trait', 'scores', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'riasec_type', 'order')
    list_filter = ('riasec_type',)
    search_fields = ('text',)