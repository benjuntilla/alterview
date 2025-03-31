import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Utility function to generate random integers
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;  // Add API key for external API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create a Supabase client with the service key for full access
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

/**
 * Posts data to a specified Supabase table
 * @param tableName - The name of the table to post data to
 * @param data - The data to post to the table
 * @returns The result of the insert operation
 */
export async function postToSupabase(tableName: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) {
      console.error('Error posting to Supabase:', error);
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('Exception when posting to Supabase:', error);
    throw error;
  }
}

/**
 * Posts data specifically to the AssessmentResult table
 * @param assessmentId - The ID of the assessment
 * @param teacherId - The ID of the teacher
 * @param studentId - The ID of the student
 * @param voiceRecordingId - The ID of the voice recording (optional)
 * @param transcript - The transcript text (optional)
 * @param mindmap - The mindmap JSON data (optional)
 * @returns The result of the insert operation
 */
export async function postAssessmentResult(
  assessmentId: number | null,
  teacherId: number | null,
  studentId: number | null,
  voiceRecordingId: number | null = null,
  transcript: string | null = null,
  mindmap: any | null = null
) {
  try {
    const generatedId = randomInt(1,1000000);
    const data = {
      id: generatedId,
      assessment_id: assessmentId,
      teacher_id: teacherId,
      student_id: studentId,
      voice_recording_id: voiceRecordingId,
      transcript: transcript,
      mindmap: mindmap
    };

    const { data: result, error } = await supabase
      .from('AssessmentResult')
      .insert(data)
      .select();
    
    if (error) {
      console.error('Error posting to AssessmentResult table:', error);
      throw error;
    }
    
    return { result, generatedId };
  } catch (error) {
    console.error('Exception when posting to AssessmentResult table:', error);
    throw error;
  }
}

/**
 * Updates data in a specified Supabase table
 * @param tableName - The name of the table to update data in
 * @param id - The id of the record to update
 * @param data - The data to update
 * @returns The result of the update operation
 */
export async function updateInSupabase(tableName: string, id: string | number, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating in Supabase:', error);
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('Exception when updating in Supabase:', error);
    throw error;
  }
}

/**
 * Deletes data from a specified Supabase table
 * @param tableName - The name of the table to delete data from
 * @param id - The id of the record to delete
 * @returns The result of the delete operation
 */
export async function deleteFromSupabase(tableName: string, id: string | number) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error deleting from Supabase:', error);
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('Exception when deleting from Supabase:', error);
    throw error;
  }
}

/**
 * Fetches data from a specified Supabase table
 * @param tableName - The name of the table to fetch data from
 * @param query - Optional query parameters
 * @returns The fetched data
 */
export async function fetchFromSupabase(tableName: string, query?: any) {
  try {
    let queryBuilder = supabase.from(tableName).select('*');
    
    // Apply query parameters if provided
    if (query) {
      // Example: if query has a filter property
      if (query.filter) {
        for (const [key, value] of Object.entries(query.filter)) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      }
      
      // Example: if query has a limit property
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error('Error fetching from Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when fetching from Supabase:', error);
    throw error;
  }
}

export { supabase }; 


//getPrompts from supabase in  Assessment table using id , return system_prompt and first_question
export async function getPrompts(id: number) {
  const { data, error } = await supabase
    .from('Assessment')
    .select('system_prompt, first_question')
    .eq('id', id)
    .single();
}

//getMindmap string from Assessment Table using id, return mindmap string
export async function getMindmap(id: number) {
  const { data, error } = await supabase
    .from('Assessment')
    .select('mindmap_template')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching mindmap:', error);
    return null;
  }
  
  return data?.mindmap_template;
}

//getStudentName from Student table using id, return student name
export async function getStudentName(id: number) {
  const { data, error } = await supabase
    .from('Student')
    .select('name')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching student name:', error);
    return null;
  }
  
  return data?.name;
}

//process mindmap method. takes in an assessment result id calls an api, pushes the mindmap to the supabase db, and then returns a good or bad response
export async function processMindmap(assessmentResultId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/assessment-results/${assessmentResultId}/process`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const result = await response.json().then(data => data.mindmap);
    
    // Convert the JSON to a string before storing
    const mindmapString = JSON.stringify(result);

    console.log(mindmapString);
    
    const { data, error } = await supabase
      .from('AssessmentResult')
      .update({ mindmap: mindmapString })
      .eq('id', assessmentResultId);

    if (error) {
      console.error('Error updating mindmap:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error processing mindmap:', error);
    return null;
  }
}

/**
 * Assigns an assessment to a student by updating their assessment_ids array
 * @param studentId - The ID of the student
 * @param assessmentId - The ID of the assessment to assign
 * @returns The result of the update operation
 */
export async function assignAssessmentToStudent(
  studentId: number,
  assessmentId: number
) {
  try {
    // First, get the current assessment_ids array for the student
    const { data: student, error: fetchError } = await supabase
      .from('Student')
      .select('assessment_ids')
      .eq('id', studentId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching student data:', fetchError);
      throw fetchError;
    }

    // Create a new array with the existing assessments plus the new one
    const currentAssessments = student?.assessment_ids || [];
    const updatedAssessments = Array.from(new Set([...currentAssessments, assessmentId]));

    // Update the student's assessment_ids array
    const { data: result, error: updateError } = await supabase
      .from('Student')
      .update({ assessment_ids: updatedAssessments })
      .eq('id', studentId)
      .select();
    
    if (updateError) {
      console.error('Error updating student assessments:', updateError);
      throw updateError;
    }
    
    return result;
  } catch (error) {
    console.error('Exception when assigning assessment to student:', error);
    throw error;
  }
}