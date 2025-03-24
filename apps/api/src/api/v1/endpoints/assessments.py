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
    Generate a mindmap from educational content using OpenRouter API with structured outputs.
    
    The endpoint analyzes the input text to:
    - Identify the main topic
    - Extract 3-5 key subtopics
    - Generate concise descriptions
    - Create up to 2 levels of nesting
    
    Here's an example mindmap that you should follow:
{
  "topic": {
    "name": "Monetary Policy",
    "description": "The actions undertaken by a nation's central bank to control the money supply and achieve macroeconomic objectives such as price stability, full employment, and sustainable economic growth. Monetary policy involves managing interest rates, reserve requirements, and other monetary tools to influence credit conditions and overall economic activity.",
    "assessmentCriteria": {
      "excellentUnderstanding": [
        "Student can precisely define monetary policy and distinguish it from fiscal policy",
        "Student can analyze how monetary policy actions transmit through the economy via different channels",
        "Student can evaluate the effectiveness of monetary policy under different economic conditions and constraints"
      ],
      "adequateUnderstanding": [
        "Student broadly understands monetary policy as central bank actions that influence the economy",
        "Student can identify basic monetary policy tools such as interest rate adjustments"
      ],
      "misconceptions": [
        "Confusing monetary policy (conducted by central banks) with fiscal policy (conducted by governments)",
        "Believing that monetary policy can precisely control inflation or unemployment in all circumstances",
        "Assuming monetary policy actions have immediate effects on the economy"
      ],
      "tutorGuidance": "Do not present any single monetary policy approach as universally optimal. Guide students to understand that the effectiveness of monetary policy depends on economic conditions, institutional contexts, and policy coordination."
    },
    "studentResponse": "",
    "understandingLevel": null,
    "subtopics": [
      {
        "name": "Central Banks",
        "description": "Institutions responsible for conducting monetary policy, supervising financial institutions, maintaining financial stability, and providing banking services to commercial banks and governments. Central banks typically operate with some degree of independence from political authorities.",
        "assessmentCriteria": {
          "excellentUnderstanding": [
            "Student can explain the rationale for central bank independence and its relationship to policy effectiveness",
            "Student can compare and contrast the structure, mandates, and policy approaches of major central banks",
            "Student understands the evolution of central bank functions and objectives over time"
          ],
          "adequateUnderstanding": [
            "Student recognizes central banks as the institutions that implement monetary policy",
            "Student can identify major central banks like the Federal Reserve or European Central Bank"
          ],
          "misconceptions": [
            "Confusing central banks with commercial banks or government treasury departments",
            "Viewing central banks as either completely independent or completely controlled by governments",
            "Assuming all central banks have identical mandates and policy frameworks"
          ],
          "tutorGuidance": "Avoid simplistic characterizations of central bank independence as either entirely positive or negative. Help students understand the complex trade-offs between democratic accountability and insulation from short-term political pressures."
        },
        "studentResponse": "",
        "understandingLevel": null,
        "subtopics": [
          {
            "name": "Federal Reserve System",
            "description": "The central banking system of the United States, consisting of the Board of Governors, 12 regional Reserve Banks, and the Federal Open Market Committee (FOMC). The Fed conducts monetary policy to promote maximum employment, stable prices, and moderate long-term interest rates.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain the Federal Reserve's dual mandate and how it influences policy decisions",
                "Student understands the Fed's organizational structure and decision-making process",
                "Student can evaluate how the Fed's approach to monetary policy has evolved since its founding"
              ],
              "adequateUnderstanding": [
                "Student recognizes the Federal Reserve as the U.S. central bank",
                "Student can identify that the Fed sets interest rates and influences money supply"
              ],
              "misconceptions": [
                "Believing the Fed is a government agency rather than an independent central bank",
                "Assuming the Fed directly controls all interest rates in the economy",
                "Not understanding the relationship between the Board of Governors and regional Reserve Banks"
              ],
              "tutorGuidance": "Don't present the Federal Reserve as either completely independent or politically controlled. Help students understand the Fed's unique public-private structure and the tensions between independence and accountability."
            },
            "studentResponse": "",
            "understandingLevel": null
          },
          {
            "name": "European Central Bank",
            "description": "The central bank responsible for monetary policy in the Eurozone, consisting of 19 European Union countries that have adopted the euro. The ECB's primary mandate is to maintain price stability, with a secondary objective of supporting general economic policies.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain the challenges of conducting monetary policy for multiple sovereign nations",
                "Student understands the ECB's primary focus on price stability versus the Fed's dual mandate",
                "Student can analyze how the Eurozone debt crisis influenced ECB policy evolution"
              ],
              "adequateUnderstanding": [
                "Student recognizes the ECB as the central bank for the Eurozone",
                "Student can identify that the ECB sets a single monetary policy for multiple countries"
              ],
              "misconceptions": [
                "Confusing the European Central Bank with the European Commission or other EU institutions",
                "Assuming the ECB has the same mandate and tools as the Federal Reserve",
                "Not recognizing the constraints of monetary union without fiscal union"
              ],
              "tutorGuidance": "Don't oversimplify the challenges of the ECB's multinational context. Help students understand how differing economic conditions across member states complicate monetary policy implementation."
            },
            "studentResponse": "",
            "understandingLevel": null
          },
          {
            "name": "Central Bank Independence",
            "description": "The degree to which central banks can formulate and implement monetary policy without direct political influence. Independence typically includes institutional, operational, and financial dimensions, with varying arrangements across different countries.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain different dimensions of central bank independence and how they are institutionalized",
                "Student understands the theoretical and empirical arguments regarding independence and policy outcomes",
                "Student can analyze the balance between independence and democratic accountability"
              ],
              "adequateUnderstanding": [
                "Student recognizes that central bank independence relates to freedom from political interference",
                "Student can identify some benefits of central bank independence for policy credibility"
              ],
              "misconceptions": [
                "Viewing central bank independence as an absolute rather than a matter of degree",
                "Assuming independence always leads to better policy outcomes",
                "Not recognizing the potential tensions between independence and democratic legitimacy"
              ],
              "tutorGuidance": "Present central bank independence as a complex institutional design question rather than a simple good/bad dichotomy. Help students understand both the benefits for policy credibility and the challenges for democratic governance."
            },
            "studentResponse": "",
            "understandingLevel": null
          }
        ]
      },
      {
        "name": "Monetary Policy Tools",
        "description": "The instruments and mechanisms through which central banks implement monetary policy to influence the money supply, credit conditions, and overall economic activity. These include conventional tools that directly affect interest rates and money supply, as well as unconventional tools deployed during financial crises or when conventional tools reach their limits.",
        "assessmentCriteria": {
          "excellentUnderstanding": [
            "Student can explain how different monetary policy tools affect the money supply and interest rates",
            "Student can analyze the transmission mechanisms through which policy tools impact the broader economy",
            "Student understands when and why central banks might choose different tools in various economic conditions"
          ],
          "adequateUnderstanding": [
            "Student recognizes basic monetary policy tools like interest rates and reserve requirements",
            "Student can distinguish between expansionary and contractionary policy approaches"
          ],
          "misconceptions": [
            "Believing central banks directly control all interest rates in the economy",
            "Assuming monetary policy tools have immediate and predictable effects",
            "Not recognizing the evolution of policy tools in response to changing economic conditions"
          ],
          "tutorGuidance": "Avoid oversimplifying the relationship between policy tools and economic outcomes. Help students understand the complex and often uncertain transmission mechanisms through which monetary policy affects the economy."
        },
        "studentResponse": "",
        "understandingLevel": null,
        "subtopics": [
          {
            "name": "Conventional Monetary Policy Tools",
            "description": "The standard instruments used by central banks to conduct monetary policy under normal economic conditions. These include setting policy interest rates, establishing reserve requirements, and conducting open market operations to control the money supply and influence broader economic conditions.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain how each conventional tool affects the money supply and interest rates",
                "Student understands the relationship between conventional tools and the monetary transmission mechanism",
                "Student can analyze situations where conventional tools may be more or less effective"
              ],
              "adequateUnderstanding": [
                "Student recognizes the main conventional monetary policy tools",
                "Student can identify whether a tool would create expansionary or contractionary effects"
              ],
              "misconceptions": [
                "Confusing the discount rate with the federal funds rate",
                "Assuming direct and immediate connections between tool adjustments and economic outcomes",
                "Not understanding the different roles of price and quantity tools in monetary policy"
              ],
              "tutorGuidance": "Don't present monetary policy as a precise science with predictable outcomes. Help students understand the complex and variable lags between policy actions and economic effects."
            },
            "studentResponse": "",
            "understandingLevel": null,
            "subtopics": [
              {
                "name": "Policy Interest Rates",
                "description": "The interest rates set by central banks to influence short-term borrowing costs throughout the economy. In the U.S., this includes the federal funds rate (the rate banks charge each other for overnight loans) and the discount rate (the rate at which banks can borrow from the Fed).",
                "assessmentCriteria": {
                  "excellentUnderstanding": [
                    "Student can explain the relationship between policy rates and market interest rates",
                    "Student understands how interest rate changes transmit through the economy",
                    "Student can analyze the Taylor Rule and other guidelines for setting policy rates"
                  ],
                  "adequateUnderstanding": [
                    "Student recognizes that central banks set key interest rates to influence the economy",
                    "Student can identify that lower rates are expansionary and higher rates are contractionary"
                  ],
                  "misconceptions": [
                    "Believing central banks directly set all interest rates in the economy",
                    "Assuming interest rate changes have immediate effects on inflation or output",
                    "Not understanding the difference between nominal and real interest rates"
                  ],
                  "tutorGuidance": "Don't oversimplify the relationship between policy rates and market rates. Help students understand both the power and limitations of interest rate policy."
                },
                "studentResponse": "",
                "understandingLevel": null
              },
              {
                "name": "Open Market Operations",
                "description": "The buying and selling of government securities by central banks to influence the money supply and interest rates. Traditional open market operations are used to achieve target interest rates by affecting bank reserves in the banking system.",
                "assessmentCriteria": {
                  "excellentUnderstanding": [
                    "Student can explain the mechanics of open market operations and their impact on bank reserves",
                    "Student understands how open market operations transmit to broader interest rates and money supply",
                    "Student can distinguish between defensive and dynamic open market operations"
                  ],
                  "adequateUnderstanding": [
                    "Student recognizes that open market operations involve buying/selling government securities",
                    "Student can identify that purchasing securities is expansionary while selling is contractionary"
                  ],
                  "misconceptions": [
                    "Confusing open market operations with fiscal policy or government budget operations",
                    "Assuming open market operations directly control the money supply with precision",
                    "Not distinguishing between temporary and permanent open market operations"
                  ],
                  "tutorGuidance": "Don't present open market operations as directly determining the money supply. Help students understand the complex relationship between reserves, bank lending, and broad money measures."
                },
                "studentResponse": "",
                "understandingLevel": null
              },
              {
                "name": "Reserve Requirements",
                "description": "Regulations that require banks to hold a specified fraction of their deposits as reserves. By adjusting reserve requirements, central banks can influence banks' ability to create money through lending, though this tool has become less common in modern monetary policy.",
                "assessmentCriteria": {
                  "excellentUnderstanding": [
                    "Student can explain how reserve requirements affect the money multiplier and money supply",
                    "Student understands why reserve requirements have become less important in modern monetary policy",
                    "Student can analyze the relationship between reserve requirements and bank lending behavior"
                  ],
                  "adequateUnderstanding": [
                    "Student recognizes that reserve requirements limit how much banks can lend",
                    "Student can identify that lower requirements are expansionary while higher are contractionary"
                  ],
                  "misconceptions": [
                    "Believing the money multiplier model precisely describes bank lending behavior",
                    "Assuming banks always lend up to their reserve constraint",
                    "Not recognizing that many central banks have moved away from using reserve requirements"
                  ],
                  "tutorGuidance": "Don't overemphasize the importance of reserve requirements in contemporary monetary policy. Help students understand why this tool has declined in importance relative to interest rate policy."
                },
                "studentResponse": "",
                "understandingLevel": null
              }
            ]
          },
          {
            "name": "Unconventional Monetary Policy Tools",
            "description": "Non-standard instruments used by central banks when conventional tools reach their limits, such as during financial crises or when interest rates approach zero. These include quantitative easing, forward guidance, negative interest rates, and yield curve control.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain the rationale for using unconventional tools when conventional tools are constrained",
                "Student understands how different unconventional tools impact financial markets and the broader economy",
                "Student can evaluate the effectiveness and potential risks of unconventional monetary policies"
              ],
              "adequateUnderstanding": [
                "Student recognizes that unconventional tools are used in unusual economic circumstances",
                "Student can identify examples of unconventional policies like quantitative easing"
              ],
              "misconceptions": [
                "Viewing quantitative easing as simply 'printing money'",
                "Assuming unconventional policies have the same transmission mechanisms as conventional ones",
                "Not recognizing the possible limitations and side effects of unconventional tools"
              ],
              "tutorGuidance": "Don't present unconventional policies as either panaceas or disasters. Help students understand both the potential benefits and risks associated with these tools."
            },
            "studentResponse": "",
            "understandingLevel": null,
            "subtopics": [
              {
                "name": "Quantitative Easing",
                "description": "A monetary policy in which a central bank purchases longer-term securities from the open market to increase the money supply and encourage lending and investment. QE is typically used when short-term interest rates are at or near zero and conventional monetary policy has reached its limit.",
                "assessmentCriteria": {
                  "excellentUnderstanding": [
                    "Student can explain the mechanics of QE and its theoretical channels of influence",
                    "Student understands how QE differs from conventional open market operations",
                    "Student can evaluate evidence on QE's effectiveness and potential side effects"
                  ],
                  "adequateUnderstanding": [
                    "Student recognizes QE as large-scale asset purchases by central banks",
                    "Student can identify that QE aims to lower long-term interest rates and stimulate the economy"
                  ],
                  "misconceptions": [
                    "Equating QE with simply 'printing money' or directly financing government spending",
                    "Assuming QE necessarily leads to high inflation",
                    "Not distinguishing between different QE programs and their specific designs"
                  ],
                  "tutorGuidance": "Don't present QE as either completely effective or ineffective. Help students understand the mixed empirical evidence and theoretical debates about its transmission channels and effects."
                },
                "studentResponse": "",
                "understandingLevel": null
              },
              {
                "name": "Forward Guidance",
                "description": "Central bank communications about the likely future path of monetary policy, intended to influence market expectations and longer-term interest rates. Forward guidance can be qualitative or quantitative, time-based or state-contingent.",
                "assessmentCriteria": {
                  "excellentUnderstanding": [
                    "Student can explain how forward guidance works through expectations channels",
                    "Student understands different types of forward guidance and their implications",
                    "Student can analyze the credibility challenges associated with forward guidance"
                  ],
                  "adequateUnderstanding": [
                    "Student recognizes forward guidance as communication about future policy",
                    "Student can identify that forward guidance aims to influence long-term interest rates"
                  ],
                  "misconceptions": [
                    "Viewing forward guidance as binding commitments rather than conditional statements",
                    "Assuming forward guidance always influences market expectations as intended",
                    "Not recognizing the time inconsistency problems associated with forward guidance"
                  ],
                  "tutorGuidance": "Don't present forward guidance as simply making announcements. Help students understand the complex issues of credibility, commitment, and expectations management involved."
                },
                "studentResponse": "",
                "understandingLevel": null
              },
              {
                "name": "Negative Interest Rate Policy",
                "description": "A monetary policy in which nominal target interest rates are set below zero percent. Under this policy, banks must pay interest to deposit their funds with the central bank, which aims to stimulate economic activity by encouraging banks to lend rather than hold reserves.",
                "assessmentCriteria": {
                  "excellentUnderstanding": [
                    "Student can explain the rationale for negative rates and their transmission mechanisms",
                    "Student understands the potential constraints and side effects of negative rate policies",
                    "Student can analyze evidence from countries that have implemented negative rates"
                  ],
                  "adequateUnderstanding": [
                    "Student recognizes negative rates as charging banks for holding reserves",
                    "Student can identify that negative rates aim to stimulate lending and spending"
                  ],
                  "misconceptions": [
                    "Assuming negative rates necessarily extend to all interest rates in the economy",
                    "Believing negative rates are theoretically impossible due to cash substitution",
                    "Not recognizing the potential adverse effects on bank profitability and financial stability"
                  ],
                  "tutorGuidance": "Don't present negative rates as either completely ineffective or clearly optimal. Help students understand the theoretical arguments and mixed empirical evidence regarding their effectiveness and side effects."
                },
                "studentResponse": "",
                "understandingLevel": null
              }
            ]
          }
        ]
      },
      {
        "name": "Monetary Policy Transmission Mechanisms",
        "description": "The channels through which monetary policy actions affect the real economy, including interest rates, exchange rates, asset prices, bank lending, and expectations. These mechanisms explain how changes in policy instruments ultimately impact inflation, employment, and output.",
        "assessmentCriteria": {
          "excellentUnderstanding": [
            "Student can explain multiple channels through which monetary policy affects the economy",
            "Student understands the lags and uncertainties in monetary policy transmission",
            "Student can analyze factors that strengthen or weaken different transmission channels"
          ],
          "adequateUnderstanding": [
            "Student recognizes that monetary policy works through multiple channels",
            "Student can identify that monetary policy affects the economy with variable lags"
          ],
          "misconceptions": [
            "Assuming monetary policy has immediate effects on inflation and output",
            "Viewing the transmission process as mechanical rather than influenced by expectations and behavior",
            "Not recognizing that transmission channels may vary in importance across different economic conditions"
          ],
          "tutorGuidance": "Avoid presenting the transmission mechanism as a simple, predictable process. Help students understand the complex and often uncertain ways that monetary policy influences the economy."
        },
        "studentResponse": "",
        "understandingLevel": null,
        "subtopics": [
          {
            "name": "Interest Rate Channel",
            "description": "The traditional mechanism by which changes in policy rates affect real interest rates, which in turn influence consumption, investment, and aggregate demand. The interest rate channel operates through both the cost of capital and income effects.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain how policy rates transmit to market rates of different maturities",
                "Student understands how real interest rates affect consumption and investment decisions",
                "Student can analyze factors that strengthen or weaken the interest rate channel"
              ],
              "adequateUnderstanding": [
                "Student recognizes that lower interest rates typically stimulate spending",
                "Student can identify that interest rate changes affect borrowing costs for households and firms"
              ],
              "misconceptions": [
                "Assuming policy rate changes transmit fully and immediately to all market interest rates",
                "Not recognizing that interest sensitivity varies across different sectors of the economy",
                "Underestimating the importance of real versus nominal interest rates"
              ],
              "tutorGuidance": "Don't present the interest rate channel as uniformly powerful across all economic conditions. Help students understand when interest rates are more or less effective as a policy tool."
            },
            "studentResponse": "",
            "understandingLevel": null
          },
          {
            "name": "Credit Channel",
            "description": "The mechanism by which monetary policy affects the economy through changes in the availability and cost of bank loans and other forms of credit. Includes both bank lending and balance sheet channels, focusing on how policy affects credit supply.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain both the bank lending and balance sheet aspects of the credit channel",
                "Student understands how financial frictions amplify monetary policy effects",
                "Student can analyze how the credit channel operates differently during financial crises"
              ],
              "adequateUnderstanding": [
                "Student recognizes that monetary policy affects banks' willingness to lend",
                "Student can identify that credit availability impacts business investment and consumer spending"
              ],
              "misconceptions": [
                "Assuming banks automatically increase lending when central banks ease policy",
                "Not recognizing the role of risk assessment and capital constraints in bank lending decisions",
                "Viewing the credit channel as independent of the interest rate channel"
              ],
              "tutorGuidance": "Don't oversimplify the relationship between monetary policy and credit creation. Help students understand the complex factors that influence bank lending beyond policy rates."
            },
            "studentResponse": "",
            "understandingLevel": null
          },
          {
            "name": "Exchange Rate Channel",
            "description": "The mechanism by which monetary policy affects aggregate demand through changes in the exchange rate and subsequent effects on exports, imports, and international capital flows. This channel is particularly important for small open economies.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain how interest rate differentials affect exchange rates",
                "Student understands the relationship between exchange rate changes and net exports",
                "Student can analyze factors that strengthen or weaken the exchange rate channel"
              ],
              "adequateUnderstanding": [
                "Student recognizes that monetary policy affects exchange rates",
                "Student can identify that currency appreciation typically reduces net exports"
              ],
              "misconceptions": [
                "Assuming monetary tightening always strengthens the domestic currency",
                "Not recognizing the role of capital flows and expectations in exchange rate determination",
                "Viewing exchange rate effects as uniformly beneficial or harmful"
              ],
              "tutorGuidance": "Don't present exchange rate movements as having unambiguous welfare effects. Help students understand that currency changes create both winners and losers within an economy."
            },
            "studentResponse": "",
            "understandingLevel": null
          },
          {
            "name": "Expectations Channel",
            "description": "The mechanism by which monetary policy affects the economy through its influence on expectations of future inflation, interest rates, and economic conditions. This channel emphasizes the importance of central bank credibility and communication.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain how monetary policy influences inflation expectations",
                "Student understands the role of central bank credibility in anchoring expectations",
                "Student can analyze how expectations affect current economic decisions"
              ],
              "adequateUnderstanding": [
                "Student recognizes that expectations about future conditions influence current behavior",
                "Student can identify that central bank communications affect market expectations"
              ],
              "misconceptions": [
                "Viewing expectations as passively reflecting policy rather than actively influencing outcomes",
                "Assuming central bank announcements are always fully credible",
                "Not recognizing how expectations formation has evolved with changing policy frameworks"
              ],
              "tutorGuidance": "Don't present expectations as either completely rational or completely backward-looking. Help students understand the complex ways expectations are formed and updated."
            },
            "studentResponse": "",
            "understandingLevel": null
          }
        ]
      },
      {
        "name": "Monetary Policy Frameworks",
        "description": "The strategies and approaches central banks use to guide monetary policy decisions, including inflation targeting, price level targeting, nominal GDP targeting, and monetary targeting. These frameworks provide structure for policy decisions and communicate the central bank's objectives to the public.",
        "assessmentCriteria": {
          "excellentUnderstanding": [
            "Student can compare different monetary policy frameworks and their theoretical foundations",
            "Student understands how policy frameworks influence central bank credibility and effectiveness",
            "Student can evaluate how frameworks have evolved in response to economic challenges"
          ],
          "adequateUnderstanding": [
            "Student recognizes that central banks operate under different policy frameworks",
            "Student can identify inflation targeting as the dominant modern framework"
          ],
          "misconceptions": [
            "Assuming a single optimal framework exists for all countries and circumstances",
            "Viewing frameworks as rigid rules rather than structured approaches to discretion",
            "Not recognizing the evolution of frameworks in response to changing economic understanding"
          ],
          "tutorGuidance": "Don't present any single framework as clearly superior for all contexts. Help students understand how different frameworks address particular economic challenges and reflect different priorities."
        },
        "studentResponse": "",
        "understandingLevel": null,
        "subtopics": [
          {
            "name": "Inflation Targeting",
            "description": "A monetary policy framework in which the central bank explicitly announces an inflation target and uses its policy tools to achieve that target over a specified time horizon. This approach prioritizes price stability while allowing flexibility to address other objectives.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain the rationale and mechanics of inflation targeting",
                "Student understands variations in inflation targeting practice across central banks",
                "Student can evaluate the effectiveness and potential limitations of inflation targeting"
              ],
              "adequateUnderstanding": [
                "Student recognizes inflation targeting as setting specific inflation goals",
                "Student can identify major central banks that use inflation targeting"
              ],
              "misconceptions": [
                "Viewing inflation targeting as mechanically prioritizing inflation over all other objectives",
                "Assuming all inflation targeting regimes are identical",
                "Not recognizing the flexibility built into most inflation targeting frameworks"
              ],
              "tutorGuidance": "Don't present inflation targeting as a rigid rule-based system. Help students understand the 'constrained discretion' that characterizes actual inflation targeting practice."
            },
            "studentResponse": "",
            "understandingLevel": null
          },
          {
            "name": "Rules vs. Discretion",
            "description": "The debate over whether monetary policy should follow predetermined rules or allow policymakers flexibility to respond to changing conditions. This tension influences how central banks balance predictability and adaptability in their policy frameworks.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can explain the theoretical arguments for rules and discretion",
                "Student understands how time inconsistency problems relate to the rules vs. discretion debate",
                "Student can evaluate how modern policy frameworks balance rules and discretion"
              ],
              "adequateUnderstanding": [
                "Student recognizes the basic trade-off between predictable rules and flexible discretion",
                "Student can identify examples of rule-like elements in monetary policy"
              ],
              "misconceptions": [
                "Viewing the debate as a binary choice rather than a spectrum",
                "Not recognizing how institutional design can address time inconsistency problems",
                "Assuming that either pure rules or pure discretion is optimal"
              ],
              "tutorGuidance": "Don't present the rules versus discretion debate as resolved. Help students understand the ongoing theoretical and practical considerations that shape this discussion."
            },
            "studentResponse": "",
            "understandingLevel": null
          },
          {
            "name": "Taylor Rule",
            "description": "A monetary policy rule that specifies how a central bank should adjust its interest rate policy in response to changes in inflation and output gaps. The rule provides a systematic guideline for interest rate decisions while allowing for some policy discretion.",
            "assessmentCriteria": {
              "excellentUnderstanding": [
                "Student can express the Taylor Rule mathematically and explain its components",
                "Student understands how the rule balances inflation and output objectives",
                "Student can evaluate how actual policy decisions compare to Taylor Rule prescriptions"
              ],
              "adequateUnderstanding": [
                "Student recognizes the Taylor Rule as a formula for setting interest rates",
                "Student can identify that the rule responds to both inflation and output"
              ],
              "misconceptions": [
                "Viewing the Taylor Rule as a mechanical formula that central banks strictly follow",
                "Not recognizing the challenges in measuring unobservable variables like potential output",
                "Assuming the original Taylor Rule coefficients are optimal for all economies"
              ],
              "tutorGuidance": "Don't present the Taylor Rule as a precise prescription that central banks should mechanically follow. Help students understand its value as a benchmark while recognizing its limitations."
            },
            "studentResponse": "",
            "understandingLevel": null
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