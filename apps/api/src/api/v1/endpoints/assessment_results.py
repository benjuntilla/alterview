import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from supabase._async.client import AsyncClient
from datetime import datetime
import os
import requests


from ...dependencies import get_db
from ....schemas.assessment_result import AssessmentResult, AssessmentResultCreate, AssessmentResultUpdate, AssessmentResultResponse
from ....crud.assessment_result import assessment_result
from ....crud.assessment import assessment
from ....config import settings

router = APIRouter()

@router.get("/", response_model=AssessmentResultResponse)
async def create_assessment_result(result_in: AssessmentResultCreate, db: AsyncClient = Depends(get_db)):
    return await assessment_result.create(db=db, obj_in=result_in)

@router.get("/{result_id}", response_model=AssessmentResultResponse)
async def read_assessment_result(result_id: int, db: AsyncClient = Depends(get_db)):
    db_result = await assessment_result.get(db, id=result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Assessment result not found")
    return db_result

@router.get("/student/{student_id}", response_model=List[AssessmentResultResponse])
async def read_student_results(student_id: int, db: AsyncClient = Depends(get_db)):
    results = await assessment_result.get_by_student(db, student_id=student_id)
    return results

@router.get("/teacher/{teacher_id}", response_model=List[AssessmentResultResponse])
async def read_teacher_results(teacher_id: int, db: AsyncClient = Depends(get_db)):
    results = await assessment_result.get_by_teacher(db, teacher_id=teacher_id)
    return results

@router.put("/{result_id}", response_model=AssessmentResultResponse)
async def update_assessment_result(result_id: int, result_in: AssessmentResultUpdate, db: AsyncClient = Depends(get_db)):
    result_in.id = result_id
    return await assessment_result.update(db, obj_in=result_in)

def process_assessment(data: dict) -> dict:
    """
    Replicates the logic of the Deno serve function: 
    1. Validates 'transcript' and 'mindmap_template' in the incoming data.
    2. Calls OpenRouter to fill in the mindmap template.
    3. Calls OpenRouter again to generate insights.
    4. Returns a dictionary containing the 'mindmap' and 'insights'.
    """

    try:
        # 1. Parse and validate input
        transcript = data.get("userTranscript")
        mindmap_template = data.get("blankMindmapTemplate")

        if not transcript or not mindmap_template:
            raise ValueError("Missing required fields: 'transcript' and 'mindmap_template'")

        # Get OpenRouter API key from settings
        OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY
        if not OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is missing from settings")

        # 2. Construct the prompt to fill in the mindmap
        fill_prompt = (
            f'Given this transcript of a student\'s interview with a teacher: "{transcript}"\n\n'
            "Please analyze it and fill out the following template with relevant information. "
            "You'll need to fill in the studentResponse and understandingLevel (1-5) fields for each "
            "topic and subtopic.\n"
            "Respond ONLY with the completed JSON template, maintaining the exact same structure:\n"
            f"{json.dumps(mindmap_template, indent=2)}"
        )

        # 3. Make the first request to OpenRouter to fill the template
        fill_response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://alterview-web.vercel.app"
            },
            json={
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    {
                        "role": "user",
                        "content": fill_prompt
                    }
                ]
            },
            timeout=60
        )

        if not fill_response.ok:
            raise RuntimeError(f"OpenRouter API error: {fill_response.text}")

        fill_data = fill_response.json()
        # Clean the response content of any markdown formatting
        fill_content_raw = fill_data["choices"][0]["message"]["content"]
        fill_content = fill_content_raw.replace("```json", "").replace("```", "").strip()
        filled_template = json.loads(fill_content)

        # 4. Construct the prompt for generating insights
        insights_prompt = (
            "Based on this assessment data:\n"
            f"{json.dumps(filled_template, indent=2)}\n\n"
            "Generate 3-5 specific, actionable insights for the teacher to help this student improve. "
            "Each insight should be concrete and implementable. Format the response as a JSON array of strings."
        )

        # 5. Make the second request to OpenRouter to get the insights
        insights_response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://alterview-web.vercel.app"
            },
            json={
                "model": "openai/gpt-4o",
                "messages": [
                    {
                        "role": "user",
                        "content": insights_prompt
                    }
                ]
            },
            timeout=60
        )

        if not insights_response.ok:
            raise RuntimeError(f"OpenRouter API error generating insights: {insights_response.text}")

        insights_data = insights_response.json()
        insights_content_raw = insights_data["choices"][0]["message"]["content"]
        insights_content = insights_content_raw.replace("```json", "").replace("```", "").strip()
        clean_insights = json.loads(insights_content)

        # 6. Return the combined data
        return {
            "mindmap": filled_template,
            "insights": clean_insights
        }

    except Exception as e:
        # In a real production app, you might log the exception or return a detailed error response.
        return {
            "error": str(e)
        }

@router.get("/{result_id}/process")
async def process_assessment_result(
    result_id: int,
    db: AsyncClient = Depends(get_db)
):
    # Just return the result id that was received
    print(f"DIAGNOSTIC: Received result_id: {result_id}")
    
    # Get the existing result
    db_result = await assessment_result.get(db, id=result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Assessment result not found")
    
    #get db_result.assessment_id
    assessment_id = db_result.assessment_id

    #access the assessment table
    assessmentx = await assessment.get(db, id=assessment_id)

    blankMindmapTemplate = assessmentx.mindmap_template
    userTranscript = db_result.transcript

    data = {
        "root": "Assessment Analysis",
        "blankMindmapTemplate": blankMindmapTemplate,
        "userTranscript": userTranscript
    }

    # Process the assessment data to get the filled mindmap and insights
    processed_result = process_assessment(data)
    
    # Combine the original data with the processed results
    result = {
        "root": "Assessment Analysis",
        "blankMindmapTemplate": blankMindmapTemplate,
        "userTranscript": userTranscript,
        **processed_result
    }
    
    return result

    
