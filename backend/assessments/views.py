from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import AssessmentResult
from .services import RIASECService

class SubmitAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        answers = request.data.get('answers') # List of {type, value}
        
        if not answers:
            return Response({"error": "No answers provided"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Calculate scores using our service
        scores, top_trait = RIASECService.calculate_scores(answers)

        # 2. Save to database
        result = AssessmentResult.objects.create(
            user=request.user,
            scores=scores,
            top_trait=top_trait
        )

        return Response({
            "id": result.id,
            "scores": scores,
            "top_trait": top_trait,
            "message": "Assessment processed successfully!"
        }, status=status.HTTP_201_CREATED)
