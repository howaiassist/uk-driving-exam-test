export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  questionImageUrl?: string;
  optionImages?: string[];
  hasImages?: boolean;
}

export const questions: Question[] = [
  {
    id: 1,
    question: "What is the national speed limit for cars on a dual carriageway?",
    options: ["60 mph", "70 mph", "80 mph", "50 mph"],
    correctAnswer: 1,
    explanation: "The national speed limit for cars on dual carriageways is 70 mph."
  },
  {
    id: 2,
    question: "What does a circular blue sign with a white arrow pointing left mean?",
    options: ["No left turn", "Compulsory left turn", "Left turn ahead", "One way left"],
    correctAnswer: 1,
    explanation: "A circular blue sign with a white arrow indicates a compulsory direction."
  },
  {
    id: 3,
    question: "When should you use hazard warning lights?",
    options: ["When parking illegally", "When your vehicle has broken down", "When driving in heavy rain", "When overtaking"],
    correctAnswer: 1,
    explanation: "Hazard warning lights should be used when your vehicle has broken down or is causing an obstruction."
  },
  {
    id: 4,
    question: "What is the minimum tread depth for car tyres?",
    options: ["1.6mm", "2.0mm", "1.2mm", "2.5mm"],
    correctAnswer: 0,
    explanation: "The minimum legal tread depth for car tyres in the UK is 1.6mm."
  },
  {
    id: 5,
    question: "What does a red circular sign mean?",
    options: ["Warning", "Information", "Prohibition", "Mandatory"],
    correctAnswer: 2,
    explanation: "Red circular signs indicate prohibition - something you must not do."
  },
  {
    id: 6,
    question: "When can you use the right-hand lane of a three-lane motorway?",
    options: ["Only for overtaking", "For normal driving", "When traffic is heavy", "For emergency vehicles only"],
    correctAnswer: 0,
    explanation: "The right-hand lane of a motorway should only be used for overtaking."
  },
  {
    id: 7,
    question: "What is the speed limit in a built-up area unless otherwise stated?",
    options: ["20 mph", "30 mph", "40 mph", "50 mph"],
    correctAnswer: 1,
    explanation: "The default speed limit in built-up areas is 30 mph unless otherwise indicated."
  },
  {
    id: 8,
    question: "What should you do if you see a school crossing patrol showing a 'stop' sign?",
    options: ["Slow down and proceed with caution", "Stop and wait", "Sound your horn", "Drive around them"],
    correctAnswer: 1,
    explanation: "You must stop and wait when a school crossing patrol shows a stop sign."
  },
  {
    id: 9,
    question: "What is the stopping distance at 50 mph in good conditions?",
    options: ["53 metres", "73 metres", "96 metres", "125 metres"],
    correctAnswer: 1,
    explanation: "The total stopping distance at 50 mph is 53 metres (thinking distance + braking distance)."
  },
  {
    id: 10,
    question: "When should you check your mirrors?",
    options: ["Only when changing lanes", "Every 30 seconds", "Before signalling, manoeuvring or changing speed", "Only when reversing"],
    correctAnswer: 2,
    explanation: "You should check your mirrors before signalling, manoeuvring, or changing speed."
  },
  {
    id: 11,
    question: "What does a triangular road sign indicate?",
    options: ["Information", "Warning", "Prohibition", "Instruction"],
    correctAnswer: 1,
    explanation: "Triangular signs are warning signs that alert you to hazards ahead."
  },
  {
    id: 12,
    question: "When are you allowed to use your horn?",
    options: ["Between 11:30 pm and 7:00 am in built-up areas", "To alert other road users of your presence", "When someone cuts you off", "Never in built-up areas"],
    correctAnswer: 1,
    explanation: "You should only use your horn to alert others of your presence when necessary for safety."
  },
  {
    id: 13,
    question: "What should you do when approaching a zebra crossing with people waiting to cross?",
    options: ["Speed up to get past", "Sound your horn", "Be prepared to stop", "Flash your headlights"],
    correctAnswer: 2,
    explanation: "You should be prepared to stop and give way to pedestrians at zebra crossings."
  },
  {
    id: 14,
    question: "When can you park on the right-hand side of the road at night?",
    options: ["Never", "In a one-way street", "If there are no yellow lines", "Only in residential areas"],
    correctAnswer: 1,
    explanation: "You can only park on the right-hand side of the road at night in a one-way street."
  },
  {
    id: 15,
    question: "What is the maximum penalty for drink driving?",
    options: ["£1,000 fine", "6 months imprisonment", "Unlimited fine and 6 months imprisonment", "Community service"],
    correctAnswer: 2,
    explanation: "Drink driving can result in an unlimited fine, 6 months imprisonment, and driving ban."
  },
  {
    id: 16,
    question: "When should you use your headlights during the day?",
    options: ["Never", "In poor visibility conditions", "Only in winter", "When it's raining lightly"],
    correctAnswer: 1,
    explanation: "Use headlights during the day when visibility is seriously reduced."
  },
  {
    id: 17,
    question: "What is the purpose of ABS (Anti-lock Braking System)?",
    options: ["To stop the car faster", "To prevent the wheels from locking", "To reduce fuel consumption", "To improve steering"],
    correctAnswer: 1,
    explanation: "ABS prevents the wheels from locking under heavy braking, maintaining steering control."
  },
  {
    id: 18,
    question: "When must you give way to buses?",
    options: ["Always", "When they are pulling out from a bus stop", "Never", "Only in bus lanes"],
    correctAnswer: 1,
    explanation: "You should give way to buses when they are signalling to pull out from a bus stop."
  },
  {
    id: 19,
    question: "What should you do if you break down on a motorway?",
    options: ["Stay in your vehicle", "Move to the hard shoulder and exit the vehicle on the left", "Put on hazard lights and stay in the car", "Stand behind your vehicle"],
    correctAnswer: 1,
    explanation: "Move to the hard shoulder, exit on the left side, and stand away from your vehicle and the carriageway."
  },
  {
    id: 20,
    question: "What is the maximum speed limit for learner drivers?",
    options: ["60 mph", "70 mph", "Same as qualified drivers", "50 mph"],
    correctAnswer: 2,
    explanation: "Learner drivers must follow the same speed limits as qualified drivers."
  }
];