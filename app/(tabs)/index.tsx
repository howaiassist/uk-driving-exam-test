import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, RotateCcw, CircleCheck as CheckCircle, Clock, CircleHelp as HelpCircle, X } from 'lucide-react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Question } from '@/data/questions';
import { QuestionService } from '@/services/questionService';
import { useUser } from '@/contexts/UserContext';
import { SupabaseService } from '@/services/supabaseService';

// Mobile-safe alert helper
const showAlert = (title: string, message: string, buttons?: any[]) => {
  // Suppress alerts on mobile devices
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    console.log('Alert suppressed on mobile:', title, message);
    return;
  }
  
  try {
    const { Alert } = require('react-native');
    Alert.alert(title, message, buttons);
  } catch (error) {
    console.log('Alert error:', error);
  }
};

export default function QuizScreen() {
  const { isSubscriptionActive, subscription, isDemoUser, userId, isAuthenticated, refreshStats } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [reviewAnswers, setReviewAnswers] = useState<(number | null)[]>([]);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Load questions when component mounts
  useEffect(() => {
    loadQuestions();
  }, []);

  // Timer effect for normal users
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    console.log('Timer effect - timerActive:', timerActive, 'timeRemaining:', timeRemaining, 'isDemoUser:', isDemoUser, 'isQuizActive:', isQuizActive, 'quizStarted:', quizStarted);
    
    if (timerActive && timeRemaining > 0 && !isDemoUser) {
      interval = setInterval(() => {
        console.log('Timer tick - current time:', timeRemaining);
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            console.log('Timer expired!');
            setTimerActive(false);
            setIsQuizActive(false);
            setQuizStarted(false);
            setShowReview(true);
            setQuizCompleted(true);
            // Re-enable screen capture when time runs out
            ScreenCapture.allowScreenCaptureAsync().catch(console.warn);
            return 0;
          }
          console.log('Timer decreasing from', prev, 'to', prev - 1);
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeRemaining, isDemoUser]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      console.log('=== LOADING QUESTIONS ===');
      const questionService = QuestionService.getInstance();
      // Demo users get only 10 questions, regular users get 50
      const questionCount = isDemoUser ? 10 : 50;
      // Always get fresh random questions for each new quiz
      console.log(`Loading ${questionCount} random questions...`);
      const loadedQuestions = await questionService.getRandomQuestions(questionCount);
      console.log(`Loaded ${loadedQuestions.length} questions`);
      console.log('Sample question structure:', loadedQuestions[0]);
      console.log('========================');
      
      setQuestions(loadedQuestions);
      setAnswers(new Array(loadedQuestions.length).fill(null));
      setUserAnswers(new Array(loadedQuestions.length).fill(null));
      setReviewAnswers(new Array(loadedQuestions.length).fill(null));
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoadError('Failed to load questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    // For demo users, check if they've already completed a quiz
    if (isDemoUser && quizCompleted) {
      showAlert('Demo Limit Reached', 'Demo account can only take the quiz once. Please create a full account for unlimited access.');
      return;
    }
    
    setQuizStarted(true);
    setIsQuizActive(true);
    setTimeRemaining(45 * 60); // Reset timer to 45 minutes
    resetQuiz();
    // Start timer for non-demo users after state is set
    if (!isDemoUser) {
      setTimeout(() => {
        setTimerActive(true);
      }, 100);
    }
    // Disable screen capture when quiz starts
    ScreenCapture.preventScreenCaptureAsync().catch(console.warn);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswers(new Array(questions.length).fill(null));
    setUserAnswers(new Array(questions.length).fill(null));
    setShowResult(false);
    setShowReview(false);
    setTimerActive(false);
    setIsQuizActive(false);
    setTimeRemaining(45 * 60);
    setQuizCompleted(false);
    // Re-enable screen capture when quiz resets
    ScreenCapture.allowScreenCaptureAsync().catch(console.warn);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      // Save current answer
      if (selectedAnswer !== null) {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestion] = selectedAnswer;
        setUserAnswers(newAnswers);
      }
      
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(userAnswers[currentQuestion - 1]);
    }
  };

  const handleNext = () => {
    if (selectedAnswer === null) {
      showAlert('Please select an answer', 'You must choose an answer before proceeding.');
      return;
    }

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = selectedAnswer;
    setUserAnswers(newAnswers);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(newAnswers[currentQuestion + 1]);
    } else {
      // Ensure the last answer is saved
      const finalAnswers = [...newAnswers];
      finalAnswers[currentQuestion] = selectedAnswer;
      setUserAnswers(finalAnswers);
      setReviewAnswers(finalAnswers);
      setShowReview(true);
      setQuizCompleted(true);
      setIsQuizActive(false);
      setTimerActive(false);
      // Re-enable screen capture when quiz finishes
      ScreenCapture.allowScreenCaptureAsync().catch(console.warn);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    const answersToCheck = reviewAnswers.length > 0 ? reviewAnswers : userAnswers;
    console.log('=== SCORE CALCULATION DEBUG ===');
    console.log('Answers to check:', answersToCheck);
    console.log('Questions data:', questions.map(q => ({ 
      id: q.id, 
      correctAnswer: q.correctAnswer || q.correct_answer,
      hasCorrectAnswer: q.correctAnswer !== undefined,
      hasCorrect_answer: q.correct_answer !== undefined
    })));
    
    answersToCheck.forEach((answer, index) => {
      const question = questions[index];
      const correctAnswer = question.correctAnswer !== undefined ? question.correctAnswer : question.correct_answer;
      
      console.log(`Question ${index + 1}:`);
      console.log(`  User answer: ${answer}`);
      console.log(`  Correct answer: ${correctAnswer}`);
      console.log(`  Question object:`, question);
      
      if (answer !== null && answer === correctAnswer) {
        correctCount++;
        console.log(`  ✅ CORRECT`);
      } else {
        console.log(`  ❌ WRONG`);
      }
    });
    console.log('=== FINAL SCORE ===');
    console.log(`Total correct answers: ${correctCount} out of ${questions.length}`);
    console.log('===============================');
    return correctCount;
  };

  const handleSubmitQuiz = async () => {
    // Ensure all answers are properly set
    console.log('=== QUIZ SUBMISSION DEBUG ===');
    console.log('Review answers:', reviewAnswers);
    console.log('User answers:', userAnswers);
    console.log('Questions:', questions.map(q => ({ 
      id: q.id, 
      correctAnswer: q.correctAnswer || q.correct_answer 
    })));
    
    const finalAnswers = [...reviewAnswers];
    const finalScore = calculateScore();
    console.log('Final score calculated:', finalScore);
    console.log('==============================');
    
    setScore(finalScore);
    setAnswers([...finalAnswers]);
    setUserAnswers([...finalAnswers]);
    
    // Save quiz result to database (skip for demo users)
    if (userId && isAuthenticated && !isDemoUser) {
      try {
        const supabaseService = SupabaseService.getInstance();
        const quizResult = {
          user_id: userId,
          score: finalScore,
          total_questions: questions.length,
          passed: finalScore >= getPassMark(),
          duration_seconds: (45 * 60) - timeRemaining,
          answers: [...finalAnswers],
          question_ids: questions.map(q => q.id)
        };
        
        console.log('Saving quiz result:', quizResult);
        await supabaseService.saveQuizResult(quizResult);
        console.log('Quiz result saved successfully');
        
        // Trigger immediate stats refresh across all components
        if (typeof refreshStats === 'function') {
          console.log('Triggering stats refresh after quiz completion');
          refreshStats();
        }
      } catch (error) {
        console.error('Error saving quiz result:', error);
      }
    } else if (isDemoUser) {
      console.log('Demo user - quiz result not saved to database');
    }
    
    setShowReview(false);
    setShowResult(true);
  };

  const calculateReviewScore = () => {
    let correctCount = 0;
    reviewAnswers.forEach((answer, index) => {
      if (answer !== null && answer === questions[index].correctAnswer) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleReviewAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newReviewAnswers = [...reviewAnswers];
    newReviewAnswers[questionIndex] = answerIndex;
    setReviewAnswers(newReviewAnswers);
  };

  const getScoreColor = () => {
    if (isDemoUser) {
      const percentage = (score / questions.length) * 100;
      if (percentage >= 80) return '#059669';
      if (percentage >= 60) return '#D97706';
      return '#DC2626';
    } else {
      // For normal users: 43/50 = 86% pass mark
      if (score >= 43) return '#059669';
      if (score >= 35) return '#D97706';
      return '#DC2626';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPassMark = () => {
    return isDemoUser ? Math.ceil(questions.length * 0.8) : 43;
  };

  const hasPassed = () => {
    return isDemoUser ? score >= Math.ceil(questions.length * 0.8) : score >= 43;
  };

  const getPassPercentage = () => {
    const passScore = getPassMark();
    return Math.round((passScore / questions.length) * 100);
  };

  const getCurrentPercentage = () => {
    return Math.round((score / questions.length) * 100);
  };

  const isTimeRunningOut = () => {
    return '#DC2626';
  };

  // Clean up screen capture protection when component unmounts
  useEffect(() => {
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(console.warn);
    };
  }, []);

  // Check subscription access
  if (!isSubscriptionActive && !isDemoUser && subscription) {
    const subscriptionTypeText = subscription && subscription.subscription_type === 'weekly' ? '7-days' : '12-months';
    
    // Log subscription expiration instead of showing alert on mobile
    useEffect(() => {
      console.log(`Subscription expired: ${subscriptionTypeText} subscription is expired`);
    }, [subscriptionTypeText]);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedTitle}>{subscriptionTypeText.charAt(0).toUpperCase() + subscriptionTypeText.slice(1)} Subscription Expired</Text>
          <Text style={styles.accessDeniedText}>
            Your {subscriptionTypeText} access has expired.
          </Text>
          <Text style={styles.accessDeniedText}>
            Your subscription ended and you no longer have access to the quiz.
          </Text>
          <Text style={styles.accessDeniedDate}>
            Expired on: {new Date(subscription.end_date).toLocaleDateString('en-GB')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  // Show loading screen
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error screen
  if (loadError || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Questions</Text>
          <Text style={styles.errorText}>{loadError || 'No questions available'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuestions}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!quizStarted) {
    // Determine background colors based on subscription type
    const getGradientColors = () => {
      console.log('Getting gradient colors for subscription:', subscription?.subscription_type);
      console.log('Is demo user:', isDemoUser);
      
      if (isDemoUser) {
        return ['#1D4ED8', '#3B82F6']; // Blue for demo
      } else if (subscription && subscription.subscription_type === 'weekly') {
        console.log('Using purple gradient for weekly subscription');
        return ['#7C3AED', '#A855F7']; // Purple for 7-day
      } else if (subscription && subscription.subscription_type === 'yearly') {
        console.log('Using green gradient for yearly subscription');
        return ['#059669', '#10B981']; // Green for 12-month
      }
      console.log('Using default blue gradient');
      return ['#1D4ED8', '#3B82F6']; // Default blue
    };

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={getGradientColors()}
          style={styles.welcomeContainer}
        >
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>UK Driving Theory Test</Text>
            {isDemoUser && (
              <View style={styles.demoNotice}>
                <Text style={styles.demoNoticeText}>🎯 Demo Account - Limited to {questions.length} questions</Text>
              </View>
            )}
            {!isDemoUser && subscription && (
              <View style={styles.subscriptionNotice}>
                <Text style={styles.subscriptionNoticeText}>
                  📋 {subscription && subscription.subscription_type === 'weekly' ? '7-Day Access Plan' : '12-Month Access Plan'}
                </Text>
              </View>
            )}
            <Text style={styles.welcomeSubtitle}>
              Test your knowledge with {questions.length} multiple choice questions
            </Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>What you'll need:</Text>
              <Text style={styles.infoText}>• {questions.length} Multiple Questions to answer</Text>
              <Text style={styles.infoText}>• Pass mark: {getPassMark()} out of {questions.length} ({getPassPercentage()}%)</Text>
              {isDemoUser ? (
                <>
                  <Text style={styles.infoText}>• Time: Take as long as you need</Text>
                  <Text style={styles.infoText}>• Plan: Demo Account</Text>
                </>
              ) : (
                <>
                  <Text style={styles.infoText}>• Time limit: 45 minutes</Text>
                 <Text style={styles.infoText}>• Plan: {subscription && subscription.subscription_type === 'weekly' ? '7-Day Access Plan' : '12-Month Access Plan'}</Text>
                  {subscription && (
                    <Text style={styles.infoText}>
                      • Access: {subscription && subscription.subscription_type === 'weekly' ? '7' : '365'} days ({subscription.days_remaining || 0} days remaining)
                    </Text>
                  )}
                </>
              )}
              {isDemoUser && (
                <Text style={styles.infoText}>• Demo account: One attempt only, limited questions</Text>
              )}
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startQuiz}>
              <Text style={styles.startButtonText}>
                {isDemoUser && quizCompleted ? 'Quiz Already Completed' : 'Start Practice Test'}
              </Text>
              <ChevronRight size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            {isDemoUser && (
              <TouchableOpacity 
                style={styles.helpButton} 
                onPress={() => setShowHelpModal(true)}
              >
                <HelpCircle size={20} color="#FFFFFF" />
                <Text style={styles.helpButtonText}>Help & Support</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
        
        {/* Help Modal for Demo Users */}
        <Modal
          visible={showHelpModal}
          animationType="slide"
          presentationStyle="pageSheet"
          transparent={false}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowHelpModal(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>📧 Contact Support</Text>
                <Text style={styles.helpText}>
                  For technical support and assistance, please contact us at:
                </Text>
                <Text style={styles.helpEmail}>support@examquizfamily.com</Text>
                <Text style={styles.helpText}>
                  We typically respond within 24 hours.
                </Text>
              </View>
              
              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>🎯 About Demo Account</Text>
                <Text style={styles.helpText}>
                  • Limited to {questions.length} questions
                </Text>
                <Text style={styles.helpText}>
                  • One quiz attempt only
                </Text>
                <Text style={styles.helpText}>
                  • No time limit
                </Text>
                <Text style={styles.helpText}>
                  • Create a full account for unlimited access
                </Text>
              </View>
              
              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>📚 How to Use</Text>
                <Text style={styles.helpText}>
                  1. Tap "Start Practice Test" to begin
                </Text>
                <Text style={styles.helpText}>
                  2. Read each question carefully
                </Text>
                <Text style={styles.helpText}>
                  3. Select your answer and tap "Next"
                </Text>
                <Text style={styles.helpText}>
                  4. Review your answers before submitting
                </Text>
                <Text style={styles.helpText}>
                  5. View your results and explanations
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  if (showReview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>Review Your Answers</Text>
          <Text style={styles.reviewSubtitle}>
            Check your answers before submitting
          </Text>
        </View>

        <ScrollView style={styles.reviewContent}>
          {questions.map((q, index) => {
            const userAnswer = reviewAnswers[index];
            const isCorrect = userAnswer === q.correctAnswer;
            
            return (
              <View key={q.id} style={styles.reviewQuestion}>
                <View style={styles.reviewQuestionHeader}>
                  <Text style={styles.reviewQuestionNumber}>Q{index + 1}</Text>
                </View>
                
                <Text style={styles.reviewQuestionText}>{q.question}</Text>
                
                <View style={styles.reviewOptions}>
                  {q.options.map((option, optionIndex) => {
                    const isUserAnswer = reviewAnswers[index] === optionIndex;
                    
                    const optionStyle = [
                      styles.reviewOption,
                      isUserAnswer && styles.selectedReviewOption
                    ];
                    
                    return (
                      <TouchableOpacity 
                        key={optionIndex} 
                        style={optionStyle}
                        onPress={() => handleReviewAnswerChange(index, optionIndex)}
                      >
                        <Text style={styles.reviewOptionLetter}>
                          {String.fromCharCode(65 + optionIndex)}
                        </Text>
                        <Text style={styles.reviewOptionText}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.reviewFooter}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitQuiz}
          >
            <Text style={styles.submitButtonText}>Submit Quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showResult) {
    const percentage = getCurrentPercentage();
    const passed = hasPassed();

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <LinearGradient
            colors={passed ? ['#059669', '#10B981'] : ['#DC2626', '#EF4444']}
            style={styles.resultHeader}
          >
            <CheckCircle size={64} color="#FFFFFF" />
            <Text style={styles.resultTitle}>
              {passed ? 'Congratulations!' : 'Keep Practicing!'}
            </Text>
            <Text style={styles.resultScore}>
              {score} / {questions.length} ({percentage}%)
            </Text>
          </LinearGradient>

          <View style={styles.resultContent}>
            <Text style={styles.resultMessage}>
              {passed 
                ? (isDemoUser 
                    ? 'Well done! You passed the demo test. Create a full account to access all 50 questions!'
                    : 'Well done! You passed the practice test. You\'re ready for the real theory test!')
                : (isDemoUser
                    ? `You need at least ${getPassMark()} correct answers (${getPassPercentage()}%) to pass. Create a full account for more practice!`
                    : `You need at least ${getPassMark()} correct answers (${getPassPercentage()}%) to pass. Keep studying and try again!`)
              }
            </Text>

            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#059669' }]}>{score}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#DC2626' }]}>{questions.length - score}</Text>
                <Text style={styles.statLabel}>Incorrect</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#1D4ED8' }]}>{percentage}%</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
            </View>

            {!isDemoUser && (
              <TouchableOpacity style={styles.retryButton} onPress={() => setQuizStarted(false)}>
                <RotateCcw size={20} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Take Test Again</Text>
              </TouchableOpacity>
            )}
            
            {isDemoUser && (
              <View style={styles.demoLimitNotice}>
                <Text style={styles.demoLimitText}>
                  Demo account allows only one quiz attempt. Create a full account for unlimited practice with all 50 questions!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.progressText}>
              Question {currentQuestion + 1} of {questions.length}
            </Text>
            {!isDemoUser && (
              <View style={styles.timerContainer}>
                <Clock size={16} color={timeRemaining < 300 ? '#DC2626' : '#6B7280'} />
                <Text style={[
                  styles.timerText,
                  timeRemaining < 300 && styles.timerWarning
                ]}>
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionNumber}>Q{currentQuestion + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
          {question.question_image_url && (
            <Image 
              source={{ uri: question.question_image_url }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.selectedOption,
              ]}
              onPress={() => handleAnswerSelect(index)}
            >
              {question.option_images && question.option_images[index] && (
                <Image 
                  source={{ uri: question.option_images[index] }}
                  style={styles.optionImage}
                  resizeMode="contain"
                />
              )}
              <View style={[
                styles.optionCircle,
                selectedAnswer === index && styles.selectedCircle,
              ]}>
                <Text style={[
                  styles.optionLetter,
                  selectedAnswer === index && styles.selectedLetter,
                ]}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                selectedAnswer === index && styles.selectedOptionText,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        {currentQuestion > 0 && (
          <TouchableOpacity
            style={styles.prevButton}
            onPress={handlePrevious}
          >
            <ChevronLeft size={20} color="#FFFFFF" />
            <Text style={styles.prevButtonText}>Previous Question</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            selectedAnswer === null && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={selectedAnswer === null}
        >
          <Text style={styles.actionButtonText}>
            {currentQuestion + 1 === questions.length ? 'Finish Test' : 'Next Question'}
          </Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 40,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1D4ED8',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 26,
    marginBottom: 12,
  },
  questionImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 12,
  },
  optionsContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedOption: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  optionImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedCircle: {
    backgroundColor: '#1D4ED8',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedLetter: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#1D4ED8',
    fontWeight: '500',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  prevButton: {
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  reviewHeader: {
    backgroundColor: '#1D4ED8',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reviewSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  reviewContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  reviewQuestion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewQuestionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  correctBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  incorrectBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reviewQuestionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 16,
  },
  reviewOptions: {
    gap: 8,
  },
  reviewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedReviewOption: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },
  reviewOptionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 12,
    minWidth: 20,
  },
  reviewOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  yourAnswerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  reviewFooter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultContainer: {
    flexGrow: 1,
  },
  resultHeader: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  resultMessage: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  accessDeniedDate: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
  demoNotice: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  demoNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subscriptionNotice: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  subscriptionNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  timerWarning: {
    color: '#DC2626',
  },
  demoLimitNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  demoLimitText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 20,
  },
  helpButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 8,
  },
  helpEmail: {
    fontSize: 16,
    color: '#1D4ED8',
    fontWeight: '600',
    marginBottom: 8,
  },
});