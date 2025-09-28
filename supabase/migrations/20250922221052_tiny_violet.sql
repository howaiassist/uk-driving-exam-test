/*
  # Create questions table for UK Driving Theory Test

  1. New Tables
    - `questions`
      - `id` (integer, primary key)
      - `question` (text, the question content)
      - `options` (jsonb, array of answer options)
      - `correct_answer` (integer, index of correct answer)
      - `explanation` (text, explanation of correct answer)
      - `category` (text, question category)
      - `difficulty` (text, difficulty level)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `questions` table
    - Add policy for public read access (questions are public)
    - Add policy for authenticated admin write access
*/

CREATE TABLE IF NOT EXISTS questions (
  id integer PRIMARY KEY,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  explanation text NOT NULL,
  category text DEFAULT 'general',
  difficulty text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to questions
CREATE POLICY "Questions are publicly readable"
  ON questions
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert/update questions (for admin functionality)
CREATE POLICY "Authenticated users can manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (true);

-- Insert sample questions
INSERT INTO questions (id, question, options, correct_answer, explanation, category) VALUES
(1, 'What is the national speed limit for cars on a dual carriageway?', '["60 mph", "70 mph", "80 mph", "50 mph"]', 1, 'The national speed limit for cars on dual carriageways is 70 mph.', 'speed_limits'),
(2, 'What does a circular blue sign with a white arrow pointing left mean?', '["No left turn", "Compulsory left turn", "Left turn ahead", "One way left"]', 1, 'A circular blue sign with a white arrow indicates a compulsory direction.', 'road_signs'),
(3, 'When should you use hazard warning lights?', '["When parking illegally", "When your vehicle has broken down", "When driving in heavy rain", "When overtaking"]', 1, 'Hazard warning lights should be used when your vehicle has broken down or is causing an obstruction.', 'vehicle_safety'),
(4, 'What is the minimum tread depth for car tyres?', '["1.6mm", "2.0mm", "1.2mm", "2.5mm"]', 0, 'The minimum legal tread depth for car tyres in the UK is 1.6mm.', 'vehicle_safety'),
(5, 'What does a red circular sign mean?', '["Warning", "Information", "Prohibition", "Mandatory"]', 2, 'Red circular signs indicate prohibition - something you must not do.', 'road_signs'),
(6, 'When can you use the right-hand lane of a three-lane motorway?', '["Only for overtaking", "For normal driving", "When traffic is heavy", "For emergency vehicles only"]', 0, 'The right-hand lane of a motorway should only be used for overtaking.', 'motorway_rules'),
(7, 'What is the speed limit in a built-up area unless otherwise stated?', '["20 mph", "30 mph", "40 mph", "50 mph"]', 1, 'The default speed limit in built-up areas is 30 mph unless otherwise indicated.', 'speed_limits'),
(8, 'What should you do if you see a school crossing patrol showing a ''stop'' sign?', '["Slow down and proceed with caution", "Stop and wait", "Sound your horn", "Drive around them"]', 1, 'You must stop and wait when a school crossing patrol shows a stop sign.', 'pedestrian_crossings'),
(9, 'What is the stopping distance at 50 mph in good conditions?', '["53 metres", "73 metres", "96 metres", "125 metres"]', 1, 'The total stopping distance at 50 mph is 53 metres (thinking distance + braking distance).', 'stopping_distances'),
(10, 'When should you check your mirrors?', '["Only when changing lanes", "Every 30 seconds", "Before signalling, manoeuvring or changing speed", "Only when reversing"]', 2, 'You should check your mirrors before signalling, manoeuvring, or changing speed.', 'driving_techniques'),
(11, 'What does a triangular road sign indicate?', '["Information", "Warning", "Prohibition", "Instruction"]', 1, 'Triangular signs are warning signs that alert you to hazards ahead.', 'road_signs'),
(12, 'When are you allowed to use your horn?', '["Between 11:30 pm and 7:00 am in built-up areas", "To alert other road users of your presence", "When someone cuts you off", "Never in built-up areas"]', 1, 'You should only use your horn to alert others of your presence when necessary for safety.', 'vehicle_safety'),
(13, 'What should you do when approaching a zebra crossing with people waiting to cross?', '["Speed up to get past", "Sound your horn", "Be prepared to stop", "Flash your headlights"]', 2, 'You should be prepared to stop and give way to pedestrians at zebra crossings.', 'pedestrian_crossings'),
(14, 'When can you park on the right-hand side of the road at night?', '["Never", "In a one-way street", "If there are no yellow lines", "Only in residential areas"]', 1, 'You can only park on the right-hand side of the road at night in a one-way street.', 'parking_rules'),
(15, 'What is the maximum penalty for drink driving?', '["£1,000 fine", "6 months imprisonment", "Unlimited fine and 6 months imprisonment", "Community service"]', 2, 'Drink driving can result in an unlimited fine, 6 months imprisonment, and driving ban.', 'legal_requirements'),
(16, 'When should you use your headlights during the day?', '["Never", "In poor visibility conditions", "Only in winter", "When it''s raining lightly"]', 1, 'Use headlights during the day when visibility is seriously reduced.', 'vehicle_safety'),
(17, 'What is the purpose of ABS (Anti-lock Braking System)?', '["To stop the car faster", "To prevent the wheels from locking", "To reduce fuel consumption", "To improve steering"]', 1, 'ABS prevents the wheels from locking under heavy braking, maintaining steering control.', 'vehicle_safety'),
(18, 'When must you give way to buses?', '["Always", "When they are pulling out from a bus stop", "Never", "Only in bus lanes"]', 1, 'You should give way to buses when they are signalling to pull out from a bus stop.', 'traffic_rules'),
(19, 'What should you do if you break down on a motorway?', '["Stay in your vehicle", "Move to the hard shoulder and exit the vehicle on the left", "Put on hazard lights and stay in the car", "Stand behind your vehicle"]', 1, 'Move to the hard shoulder, exit on the left side, and stand away from your vehicle and the carriageway.', 'motorway_rules'),
(20, 'What is the maximum speed limit for learner drivers?', '["60 mph", "70 mph", "Same as qualified drivers", "50 mph"]', 2, 'Learner drivers must follow the same speed limits as qualified drivers.', 'speed_limits');