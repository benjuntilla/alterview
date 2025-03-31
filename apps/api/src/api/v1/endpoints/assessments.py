from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from supabase._async.client import AsyncClient
import httpx
import json
from typing import Dict, Any, Optional

from ...dependencies import get_db
from ....schemas.assessment import Assessment, AssessmentCreate
from ....schemas.assessment_result import AssessmentResult
from ....crud.assessment import assessment
from ....crud.assessment_result import assessment_result
from ....schemas.mindmap import MindmapRequest, MindmapResponse
from ....config import settings

router = APIRouter()

@router.post("/", response_model=Assessment)
async def create_assessment(assessment_in: AssessmentCreate, db: AsyncClient = Depends(get_db)):
    return await assessment.create(db=db, obj_in=assessment_in)

@router.get("/{assessment_id}", response_model=Assessment)
async def read_assessment(assessment_id: int, db: AsyncClient = Depends(get_db)):
    db_assessment = await assessment.get(db, id=assessment_id)
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return db_assessment

@router.get("/", response_model=List[Assessment])
async def read_assessments(db: AsyncClient = Depends(get_db)):
    assessments = await assessment.get_all(db)
    return assessments

@router.get("/teacher/{teacher_id}", response_model=List[Assessment])
async def read_teacher_assessments(teacher_id: int, db: AsyncClient = Depends(get_db)):
    assessments = await assessment.get_by_teacher(db, teacher_id=teacher_id)
    return assessments

@router.get("/student/{student_id}", response_model=List[Assessment])
async def read_student_assessments(student_id: int, db: AsyncClient = Depends(get_db)):
    """Get all assessments assigned to a specific student"""
    assessments = await assessment.get_by_student(db, student_id=student_id)
    return assessments

@router.delete("/{assessment_id}", response_model=Assessment)
async def delete_assessment(assessment_id: int, db: AsyncClient = Depends(get_db)):
    return await assessment.delete(db, id=assessment_id)

@router.get("/{assessment_id}/process")
async def process_assessment_results(
    assessment_id: int,
    db: AsyncClient = Depends(get_db)
):
    """Process mindmaps from all assessment results for a given assessment"""
    # First verify the assessment exists
    db_assessment = await assessment.get(db, id=assessment_id)
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    try:
        # Get only the mindmap field from assessment results
        results = await db.table("AssessmentResult").select("mindmap").eq("assessment_id", assessment_id).execute()
        if not results.data:
            raise HTTPException(status_code=404, detail="No assessment results found for this assessment")
        
        # Filter out None mindmaps and extract just the mindmap strings
        mindmaps = [result["mindmap"] for result in results.data if result["mindmap"]]
        
        if not mindmaps:
            raise HTTPException(status_code=404, detail="No mindmaps found in assessment results")
        
        # Call the edge function with just the mindmaps
        edge_function_response = await db.functions.invoke(
            "process-assessments",
            {"mindmaps": mindmaps}
        )
        
        # Return the processed string from the edge function
        return {"result": edge_function_response["data"]}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process mindmaps: {str(e)}"
        )

@router.post("/generate-mindmap", response_model=MindmapResponse)
async def generate_mindmap(mindmap_request: MindmapRequest):
    # Validate input text
    if not mindmap_request.text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty")
    
    # Get OpenRouter API key from settings
    API_KEY = settings.OPENROUTER_API_KEY
    if not API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="OpenRouter API key is not configured"
        )
    
    print(f"Using OpenRouter API key: {API_KEY[:10]}...{API_KEY[-5:]}")
    
    # Define the JSON schema for the structured output
    schema = {
        "type": "object",
        "properties": {
            "topic": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Main topic name extracted from content"
                    },
                    "description": {
                        "type": "string",
                        "description": "Brief description of the topic (1-2 sentences)"
                    },
                    "subtopics": {
                        "type": "array",
                        "description": "Array of 3-5 key subtopics from the content",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "Subtopic name"
                                },
                                "description": {
                                    "type": "string",
                                    "description": "Brief description of the subtopic (1-2 sentences)"
                                },
                                "subtopics": {
                                    "type": "array",
                                    "description": "Optional nested subtopics (maximum 2-3 per subtopic)",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "name": {
                                                "type": "string",
                                                "description": "Sub-subtopic name"
                                            },
                                            "description": {
                                                "type": "string",
                                                "description": "Brief description of the sub-subtopic (1 sentence)"
                                            },
                                            "subtopics": {
                                                "type": "array",
                                                "description": "Empty array as we only support 2 levels of nesting",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {},
                                                    "additionalProperties": False
                                                }
                                            }
                                        },
                                        "required": ["name", "description", "subtopics"],
                                        "additionalProperties": False
                                    }
                                }
                            },
                            "required": ["name", "description", "subtopics"],
                            "additionalProperties": False
                        }
                    }
                },
                "required": ["name", "description", "subtopics"],
                "additionalProperties": False
            }
        },
        "required": ["topic"],
        "additionalProperties": False
    }
    
    # Prepare the request to OpenRouter API
    payload = {
        "model": "openai/gpt-4o",  # or any model that supports structured outputs
        "messages": [
            {
                "role": "system",
                "content": """
    Generate a mindmap from this educational content. The user will give you title,
    description, and content. You will break apart info in the input overview into subtopics 
    and sub-subtopics.

    ALSO: If the user provides you syllabus text or policies, don't include that in the mindmap.
    
    IN SUM:
    - Identify the main topic
    - Extract 3-5 key subtopics
    - Generate concise descriptions
    - Create up to 2 levels of nesting
    
    Here's an example mindmap that you should follow:
{
  "topic": {
    "name": "",
    "description": "",
    "assessmentCriteria": {
      "excellentUnderstanding": [
        "",
        "",
        ""
      ],
      "adequateUnderstanding": [
        "",
        ""
      ],
      "misconceptions": [
        "",
        "",
        ""
      ],
      "tutorGuidance": ""
    },
    "subtopics": [
      {
        "name": "",
        "description": "",
        "assessmentCriteria": {
          "excellentUnderstanding": [
            "",
            "",
            ""
          ],
          "adequateUnderstanding": [
            "",
            ""
          ],
          "misconceptions": [
            "",
            "",
            ""
          ]
        },
        "subtopics": [
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          }
        ]
      },
      {
        "name": "",
        "description": "",
        "assessmentCriteria": {
          "excellentUnderstanding": [
            "",
            "",
            ""
          ],
          "adequateUnderstanding": [
            "",
            ""
          ],
          "misconceptions": [
            "",
            "",
            ""
          ]
        },
        "subtopics": [
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          }
        ]
      },
      {
        "name": "",
        "description": "",
        "assessmentCriteria": {
          "excellentUnderstanding": [
            "",
            "",
            ""
          ],
          "adequateUnderstanding": [
            "",
            ""
          ],
          "misconceptions": [
            "",
            "",
            ""
          ]
        },
        "subtopics": [
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          }
        ]
      },
      {
        "name": "",
        "description": "",
        "assessmentCriteria": {
          "excellentUnderstanding": [
            "",
            "",
            ""
          ],
          "adequateUnderstanding": [
            "",
            ""
          ],
          "misconceptions": [
            "",
            "",
            ""
          ]
        },
        "subtopics": [
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          }
        ]
      },
      {
        "name": "",
        "description": "",
        "assessmentCriteria": {
          "excellentUnderstanding": [
            "",
            "",
            ""
          ],
          "adequateUnderstanding": [
            "",
            ""
          ],
          "misconceptions": [
            "",
            "",
            ""
          ]
        },
        "subtopics": [
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          },
          {
            "name": "",
            "description": ""
          }
        ]
      }
    ]
  }
}
"""
            },
            {
                "role": "user",
                "content": (
                    f"Content: {mindmap_request.text}"
                )
            }
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "mindmap",
                "strict": True,
                "schema": schema
            }
        }
    }
    
    # Make the request to OpenRouter API with automatic retrying
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            headers = {
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://alterview.vercel.app",  # Add a referer header
                "X-Title": "Alterview Education App"  # Add a title header
            }
            
            print(f"Making request to OpenRouter API (attempt {retry_count + 1}/{max_retries})")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                # Check if the request was successful
                if response.status_code != 200:
                    error_detail = f"OpenRouter API error: {response.text}"
                    print(f"Error from OpenRouter API: {error_detail}")
                    
                    if response.status_code == 429:
                        # Rate limiting - retry with exponential backoff
                        retry_count += 1
                        if retry_count < max_retries:
                            import asyncio
                            backoff_seconds = 2 ** retry_count
                            print(f"Rate limit exceeded. Retrying in {backoff_seconds} seconds...")
                            await asyncio.sleep(backoff_seconds)
                            continue
                        else:
                            raise HTTPException(
                                status_code=429, 
                                detail="OpenRouter API rate limit exceeded after multiple retries. Please try again later."
                            )
                    else:
                        # For other errors, retry once
                        retry_count += 1
                        if retry_count < max_retries:
                            print(f"Retrying after error... (attempt {retry_count + 1}/{max_retries})")
                            continue
                        else:
                            raise HTTPException(
                                status_code=500, 
                                detail=error_detail
                            )
                
                # Parse the response
                result = response.json()
                print(f"Received response from OpenRouter API: {result}")
                
                # Extract the mindmap from the response
                try:
                    content = result["choices"][0]["message"]["content"]
                    
                    # Parse the JSON content
                    if isinstance(content, str):
                        try:
                            mindmap_data = json.loads(content)
                        except json.JSONDecodeError:
                            print("Response content is not valid JSON, using as-is")
                            mindmap_data = content
                    else:
                        mindmap_data = content
                    
                    # Validate response matches our expected schema
                    return MindmapResponse(**mindmap_data)
                    
                except (KeyError, json.JSONDecodeError) as e:
                    # Retry on malformed response
                    retry_count += 1
                    if retry_count < max_retries:
                        print(f"Malformed response. Retrying... (attempt {retry_count + 1}/{max_retries})")
                        continue
                    else:
                        raise HTTPException(
                            status_code=500, 
                            detail=f"Failed to parse OpenRouter API response after {max_retries} attempts: {str(e)}"
                        )
                
                # If we got here, we succeeded
                break
                    
        except httpx.RequestError as e:
            # Network-related errors
            print(f"Error making request to OpenRouter API: {str(e)}")
            retry_count += 1
            if retry_count < max_retries:
                import asyncio
                print(f"Network error. Retrying in 2 seconds... (attempt {retry_count + 1}/{max_retries})")
                await asyncio.sleep(2)
                continue
            else:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Error making request to OpenRouter API after {max_retries} attempts: {str(e)}"
                )
    
    # This should not be reached, but just in case
    raise HTTPException(
        status_code=500, 
        detail="Unknown error occurred while generating mindmap"
    ) 