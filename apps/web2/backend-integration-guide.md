# AlterView Backend Integration Guide

This guide outlines all the integration points in the teacher section of the AlterView application where frontend components need to be connected to backend API endpoints. Currently, these components use hardcoded mock data, but they need to be updated to use real data from the database.

## Table of Contents

1. [Teacher Dashboard](#teacher-dashboard)
2. [Assessment Details](#assessment-details)
3. [Student Results](#student-results)
4. [Edit Mindmap](#edit-mindmap)
5. [Assessment Service](#assessment-service)
6. [API Status](#api-status)

## Teacher Dashboard

**File:** `app/teacher/[teacher_id]/page.tsx`

**Current Implementation:** Currently uses a hardcoded array `mockAssessments` to display the list of assessments.

**Integration Points:**

1. **Fetch Assessments for Teacher**
   - Replace the mock data with an API call to fetch assessments created by the teacher
   - ✅ Available endpoint: `/api/v1/assessments/teacher/{teacher_id}`
   - Returns a list of assessments with their ID, name, creation date, etc.

```typescript
// Actual API implementation based on OpenAPI spec
const fetchTeacherAssessments = async (teacherId: string) => {
  const response = await fetch(`/api/v1/assessments/teacher/${teacherId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch teacher assessments');
  }
  const assessments = await response.json();
  
  // Transform the API data to match the UI requirements
  return assessments.map((assessment: any) => ({
    id: assessment.id.toString(),
    title: assessment.name,
    course: "", // Note: Course info not available in current API - needs to be added
    students: 0, // Note: Student count not available - needs additional API call or endpoint enhancement
    lastUpdated: new Date(assessment.created_at).toLocaleDateString()
  }));
};
```

## Assessment Details

**File:** `app/teacher/[teacher_id]/assessment/[assessment_id]/page.tsx`

**Current Implementation:** Uses multiple mock data objects including `mockStudents`, `mockAggregatedData`, and `mockInsights`.

**Integration Points:**

1. **Fetch Assessment Details**
   - Replace hardcoded assessment details with API call
   - ✅ Available endpoint: `/api/v1/assessments/{assessment_id}`
   - Returns basic assessment information

```typescript
// Actual API implementation based on OpenAPI spec
const fetchAssessmentDetails = async (assessmentId: string) => {
  const response = await fetch(`/api/v1/assessments/${assessmentId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch assessment details');
  }
  return await response.json();
};
```

2. **Fetch Student Enrollment and Completion Statistics**
   - Replace `mockStudents` with API call to get students enrolled in the assessment
   - ❌ Not directly available in current API
   - Need to join data from assessment results and student information
   - Temporary solution: Use a combination of endpoints

```typescript
// Temporary implementation using multiple API calls
const fetchAssessmentStudents = async (assessmentId: string) => {
  // Get all assessment results for this assessment
  const resultsResponse = await fetch(`/api/v1/assessment-results`);
  if (!resultsResponse.ok) {
    throw new Error('Failed to fetch assessment results');
  }
  const allResults = await resultsResponse.json();
  
  // Filter results for this assessment
  const assessmentResults = allResults.filter((result: any) => 
    result.assessment_id.toString() === assessmentId
  );
  
  // Get student details for each result
  const studentPromises = assessmentResults.map(async (result: any) => {
    const studentResponse = await fetch(`/api/v1/students/${result.student_id}`);
    if (!studentResponse.ok) {
      return null;
    }
    const student = await studentResponse.json();
    
    return {
      id: student.id.toString(),
      name: student.name,
      status: result.mindmap ? "Completed" : "In Progress",
      score: null // Score not available in current API
    };
  });
  
  const students = await Promise.all(studentPromises);
  return students.filter(student => student !== null);
};
```

3. **Generate Aggregated Insights**
   - Replace the mock `handleGenerateInsights` function with a real API call
   - ✅ Partially available: `/api/v1/assessments/{assessment_id}/process`
   - This endpoint processes assessment results but may need enhancement to return insights

```typescript
// Actual API implementation based on OpenAPI spec
const generateAssessmentInsights = async (assessmentId: string) => {
  const response = await fetch(`/api/v1/assessments/${assessmentId}/process`);
  if (!response.ok) {
    throw new Error('Failed to generate assessment insights');
  }
  return await response.json();
};
```

4. **Download Assessment Report**
   - Replace the placeholder function `handleDownloadReport` with real API call
   - ❌ Not available in current API
   - New endpoint needed for downloading assessment reports

## Student Results

**File:** `app/teacher/[teacher_id]/student/[student_id]/results/[assessment_id]/page.tsx`

**Current Implementation:** Uses `mockStudentData`, `mockAnnotations`, and hardcoded data in the `fetchResults` function.

**Integration Points:**

1. **Fetch Individual Student Results**
   - Replace the simulated data fetching in `fetchResults` with a real API call
   - ❌ Not directly available, but can combine existing endpoints
   - Need to filter assessment results by student and assessment IDs

```typescript
// Implementation using existing endpoints
const fetchStudentResults = async (studentId: string, assessmentId: string) => {
  // Get all results for this student
  const response = await fetch(`/api/v1/assessment-results/student/${studentId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch student results');
  }
  const results = await response.json();
  
  // Find the result for this specific assessment
  const result = results.find((r: any) => r.assessment_id.toString() === assessmentId);
  if (!result) {
    throw new Error('Result not found for this assessment');
  }
  
  return result;
};
```

2. **Fetch Student Profile Information**
   - Replace `mockStudentData` with real student profile data
   - ✅ Available endpoint: `/api/v1/students/{student_id}`
   - Note: The API returns limited student data compared to mock data

```typescript
// Actual API implementation based on OpenAPI spec
const fetchStudentProfile = async (studentId: string) => {
  const response = await fetch(`/api/v1/students/${studentId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch student profile');
  }
  const student = await response.json();
  
  // The API returns limited fields; UI needs more - may require API enhancement
  return {
    name: student.name,
    email: "email@example.com", // Not available in current API
    studentId: student.id.toString(),
    grade: "Undergraduate", // Not available in current API
    program: "Computer Science", // Not available in current API
    avatarUrl: `https://i.pravatar.cc/150?u=${student.id}` // Using a placeholder
  };
};
```

3. **Save Teacher Annotations**
   - Replace the client-side-only annotation functionality with API integration
   - ❌ Not available in current API
   - Need a new endpoint for annotations

4. **Download Student Results**
   - Implement the `handleDownloadResults` function to call an API endpoint
   - ❌ Not available in current API
   - Need a new endpoint for downloading student results

## Edit Mindmap

**File:** `app/teacher/[teacher_id]/assessment/[assessment_id]/edit-mindmap/page.tsx`

**Current Implementation:** Uses the `fetchAssessmentMindMap` and `updateAssessmentMindMap` functions from the assessment service.

**Integration Points:**

1. **Fetch Assessment Mindmap**
   - ✅ Partially available: The mindmap_template field in `/api/v1/assessments/{assessment_id}`
   - May need to parse the string data into a structured object

```typescript
// Fetching mindmap from assessment data
const fetchAssessmentMindMap = async (assessmentId: string) => {
  const response = await fetch(`/api/v1/assessments/${assessmentId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch assessment data');
  }
  const assessment = await response.json();
  
  // Parse the mindmap template string into an object
  try {
    return JSON.parse(assessment.mindmap_template);
  } catch (e) {
    console.error("Error parsing mindmap template:", e);
    return {}; // Return empty object if parsing fails
  }
};
```

2. **Save Updated Mindmap**
   - ❌ No direct endpoint for updating just the mindmap
   - Would need to update the entire assessment

```typescript
// Implementation using assessment update
const updateAssessmentMindMap = async (assessmentId: string, mindMapData: any) => {
  // First fetch the current assessment data
  const getResponse = await fetch(`/api/v1/assessments/${assessmentId}`);
  if (!getResponse.ok) {
    throw new Error('Failed to fetch assessment data');
  }
  const assessment = await getResponse.json();
  
  // Update the assessment with new mindmap data
  const updatedAssessment = {
    ...assessment,
    mindmap_template: JSON.stringify(mindMapData)
  };
  
  // NOTE: This endpoint is NOT in the current API - assessment update endpoint needed
  const updateResponse = await fetch(`/api/v1/assessments/${assessmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedAssessment),
  });
  
  if (!updateResponse.ok) {
    throw new Error('Failed to update mindmap');
  }
  
  return true;
};
```

## Assessment Service

**File:** `services/assessmentService.ts`

This file already contains placeholder implementations for several API calls that need to be updated to use real endpoints:

1. **fetchAssessmentPromptData**: 
   - ✅ Currently fetches from "https://alterview-api.vercel.app/api/v1/assessments" 
   - Should be updated to use `/api/v1/assessments/{assessment_id}`

2. **createAssessment**: 
   - ✅ Available endpoint: `/api/v1/assessments/` (POST)
   - Should be updated to use this endpoint

3. **fetchAssessmentMindMap**: 
   - ✅ Partially available from `/api/v1/assessments/{assessment_id}`
   - Should be updated to extract and parse the mindmap_template field

4. **updateAssessmentMindMap**: 
   - ❌ No direct endpoint for updating just the mindmap
   - Would need a new endpoint or to update the entire assessment

## API Status

Based on the OpenAPI specification, here's the status of required endpoints:

### Available Endpoints
- ✅ Get all assessments for a teacher (`/api/v1/assessments/teacher/{teacher_id}`)
- ✅ Get assessment details (`/api/v1/assessments/{assessment_id}`)
- ✅ Get student profile (`/api/v1/students/{student_id}`)
- ✅ Get assessment results for a student (`/api/v1/assessment-results/student/{student_id}`)
- ✅ Process assessment results (`/api/v1/assessments/{assessment_id}/process`)
- ✅ Create a new assessment (`/api/v1/assessments/` POST)

### Missing Endpoints
- ❌ Update an assessment (PUT method for `/api/v1/assessments/{assessment_id}`)
- ❌ Get students enrolled in a specific assessment
- ❌ Get assessment results filtered by both student and assessment
- ❌ Teacher annotations for student results
- ❌ Download assessment reports
- ❌ Download student result reports
- ❌ Enhanced student profile with additional fields (email, grade, program)
- ❌ Course information for assessments

## API Response Models

Based on the actual API schema from the OpenAPI specification:

### Assessment Model (Actual API)

```typescript
interface Assessment {
  id: number;
  created_at: string;
  name: string;
  first_question: string;
  system_prompt: string;
  mindmap_template: string; // JSON string that needs parsing
  teacher_id: number;
}
```

### Assessment Result Model (Actual API)

```typescript
interface AssessmentResultResponse {
  id: number;
  created_at: string;
  assessment_id: number;
  teacher_id: number;
  student_id: number;
  voice_recording_id: number | null;
  transcript: string | null;
  mindmap: string | null; // JSON string that needs parsing
  insights: string | null; // JSON string that needs parsing
}
```

### Student Model (Actual API)

```typescript
interface Student {
  id: number;
  created_at: string;
  name: string;
  assessment_ids: number[]; // Array of assessment IDs
}
```

## Conclusion

Implementing these API integrations will replace most of the hardcoded data with real data from the database. However, several new endpoints need to be added to fully support all the frontend features.

Key missing functionality that requires new API endpoints:
1. Update an assessment (for mindmap editing)
2. Teacher annotations for student results
3. Downloading reports
4. Enhanced student profile information
5. Course information for assessments
6. Student completion statistics

For each integration point, make sure to:
1. Implement proper error handling
2. Add loading states during API calls
3. Transform API data to match UI requirements
4. Handle cases where API data structure differs from what the UI expects 