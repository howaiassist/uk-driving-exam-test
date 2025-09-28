/*
  # Create random questions function

  1. New Functions
    - `get_random_questions` - Returns random questions from the database
  
  2. Security
    - Function is accessible to authenticated users
*/

CREATE OR REPLACE FUNCTION get_random_questions(question_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id INTEGER,
  question TEXT,
  options JSONB,
  correct_answer INTEGER,
  explanation TEXT,
  category TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    q.id,
    q.question,
    q.options,
    q.correct_answer,
    q.explanation,
    q.category,
    q.difficulty,
    q.created_at,
    q.updated_at
  FROM questions q
  ORDER BY RANDOM()
  LIMIT question_count;
$$;