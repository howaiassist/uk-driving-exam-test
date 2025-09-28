/*
  # Create quiz results table for UK Driving Theory Test

  1. New Tables
    - `quiz_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `score` (integer, number of correct answers)
      - `total_questions` (integer, total number of questions)
      - `passed` (boolean, whether the test was passed)
      - `duration_seconds` (integer, time taken in seconds)
      - `answers` (jsonb, array of user answers)
      - `question_ids` (jsonb, array of question IDs used)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `quiz_results` table
    - Add policy for users to read/insert their own results
*/

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  passed boolean NOT NULL,
  duration_seconds integer DEFAULT 0,
  answers jsonb DEFAULT '[]',
  question_ids jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Users can read their own quiz results
CREATE POLICY "Users can read own quiz results"
  ON quiz_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own quiz results
CREATE POLICY "Users can insert own quiz results"
  ON quiz_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS quiz_results_user_id_idx ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS quiz_results_created_at_idx ON quiz_results(created_at DESC);