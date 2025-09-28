import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, TrendingUp, Calendar, RotateCcw, Eye, X, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { SupabaseService } from '@/services/supabaseService';
import { QuizResult } from '@/lib/supabase';

interface QuizResultWithDetails extends QuizResult {
  questions?: Array<{
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
    user_answer: number;
  }>;
}

export default function ResultsScreen() {
  const { isDemoUser, subscription, isSubscriptionActive, name, isAuthenticated, userId, statsRefreshTrigger } = useUser();
  const [results, setResults] = useState<QuizResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<QuizResultWithDetails | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [stats, setStats] = useState({
    totalTests: 0,
    passedTests: 0,
    averageScore: 0,
    passRate: 0
  });
  
  const supabaseService = SupabaseService.getInstance();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const { router } = require('expo-router');
      router.replace('/login');
      return;
    }
    
    console.log('Loading results due to trigger change:', statsRefreshTrigger);
    loadResults();
  }, [isAuthenticated, statsRefreshTrigger]);

  const loadResults = async () => {
    if (!userId || !isAuthenticated) return;
    
    try {
      setLoading(true);
      const userResults = await supabaseService.getUserQuizResults(userId);
      const userStats = await supabaseService.getUserStats(userId);
      console.log('Loaded results:', userResults);
      console.log('Loaded stats:', userStats);
      setResults(userResults);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading results:', error);
      // Set empty results on error
      setResults([]);
      setStats({
        totalTests: 0,
        passedTests: 0,
        averageScore: 0,
        passRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewTest = async (result: QuizResultWithDetails) => {
    try {
      // Load question details for review
      const questionIds = result.question_ids as number[] || [];
      const answers = result.answers as number[] || [];
      
      if (questionIds.length === 0) {
        console.log('No question details available for this test');
        return;
      }

      // Get questions from database
      const questions = await Promise.all(
        questionIds.map(async (id, index) => {
          const question = await supabaseService.getQuestionById(id);
          if (question) {
            return {
              ...question,
              user_answer: answers[index] || -1
            };
          }
          return null;
        })
      );

      const validQuestions = questions.filter(q => q !== null);
      
      setSelectedResult({
        ...result,
        questions: validQuestions
      });
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error loading test review:', error);
    }
  };

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return '#059669';
    if (percentage >= 60) return '#D97706';
    return '#DC2626';
  };

  // Get gradient colors based on subscription type
  const getGradientColors = () => {
    if (isDemoUser) {
      return ['#1D4ED8', '#3B82F6']; // Blue for demo
    } else if (subscription && subscription.subscription_type === 'weekly') {
      return ['#7C3AED', '#A855F7']; // Purple for weekly
    } else {
      return ['#059669', '#10B981']; // Green for yearly
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Test Results</Text>
        <Text style={styles.headerSubtitle}>
          {name ? `${name}'s Progress` : 'Track your progress'}
        </Text>
        {subscription && (
          <View style={styles.subscriptionBadge}>
            <Text style={styles.subscriptionText}>
              {subscription.subscription_type === 'weekly' ? '7-Day Access Plan' : '12-Month Access Plan'}
            </Text>
            <Text style={styles.subscriptionStatus}>
              {isSubscriptionActive ? `${subscription.days_remaining || 0} days remaining` : 'Expired'}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overall Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Trophy size={24} color="#1D4ED8" />
              <Text style={styles.statNumber}>{stats.totalTests}</Text>
              <Text style={styles.statLabel}>Tests Taken</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#059669" />
              <Text style={styles.statNumber}>{stats.averageScore}%</Text>
              <Text style={styles.statLabel}>Avg. Score</Text>
            </View>
            <View style={styles.statCard}>
              <RotateCcw size={24} color="#D97706" />
              <Text style={styles.statNumber}>{stats.passRate}%</Text>
              <Text style={styles.statLabel}>Pass Rate</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading results...</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.sectionTitle}>Recent Tests</Text>
            <View style={styles.noResultsCard}>
              <Trophy size={48} color="#9CA3AF" />
              <Text style={styles.noResultsTitle}>No Test Results Yet</Text>
              <Text style={styles.noResultsText}>
                Take your first practice test to see your results here!
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Recent Tests</Text>
            {results.map((result, index) => {
              const percentage = Math.round((result.score / result.total_questions) * 100);
              const scoreColor = getScoreColor(result.score, result.total_questions);
              
              return (
                <View key={result.id} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultDate}>
                        {formatDate(result.created_at || '')}
                      </Text>
                      <Text style={styles.resultDuration}>
                        Duration: {Math.floor((result.duration_seconds || 0) / 60)}m {(result.duration_seconds || 0) % 60}s
                      </Text>
                    </View>
                    <View style={[styles.resultBadge, { backgroundColor: scoreColor }]}>
                      <Text style={styles.resultBadgeText}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreText, { color: scoreColor }]}>
                      {result.score}/{result.total_questions}
                    </Text>
                    <Text style={styles.percentageText}>({percentage}%)</Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${percentage}%`, backgroundColor: scoreColor }
                        ]} 
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => handleReviewTest(result)}
                  >
                    <Eye size={16} color="#1D4ED8" />
                    <Text style={styles.reviewButtonText}>Review Answers</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {!isDemoUser && (
          <View style={styles.tipsContainer}>
            <Text style={styles.sectionTitle}>Tips for Improvement</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>🎯 Aim for 86%+</Text>
              <Text style={styles.tipText}>
                The official theory test requires 43 out of 50 questions correct (86%)
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>📚 Study Regularly</Text>
              <Text style={styles.tipText}>
                Consistent practice helps you remember traffic rules and road signs better
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>⏱️ Take Your Time</Text>
              <Text style={styles.tipText}>
                You have 57 minutes for the real test, so read each question carefully
              </Text>
            </View>
          </View>
        )}
        
        {isDemoUser && (
          <View style={styles.demoNoticeContainer}>
            <Text style={styles.demoNoticeTitle}>Demo Account</Text>
            <Text style={styles.demoNoticeText}>
              Create a full account to access unlimited practice tests with detailed progress tracking!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Review Test Answers</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowReviewModal(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedResult?.questions?.map((question, index) => {
              const isCorrect = question.user_answer === question.correct_answer;
              
              return (
                <View key={question.id} style={styles.questionReview}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                    {isCorrect ? (
                      <CheckCircle size={20} color="#059669" />
                    ) : (
                      <XCircle size={20} color="#DC2626" />
                    )}
                  </View>
                  
                  <Text style={styles.questionText}>{question.question}</Text>
                  
                  <View style={styles.optionsReview}>
                    {question.options.map((option, optionIndex) => {
                      const isUserAnswer = question.user_answer === optionIndex;
                      const isCorrectAnswer = question.correct_answer === optionIndex;
                      
                      let optionStyle = styles.optionReview;
                      if (isCorrectAnswer) {
                        optionStyle = [styles.optionReview, styles.correctOption];
                      } else if (isUserAnswer && !isCorrectAnswer) {
                        optionStyle = [styles.optionReview, styles.wrongOption];
                      }
                      
                      return (
                        <View key={optionIndex} style={optionStyle}>
                          <Text style={styles.optionLetter}>
                            {String.fromCharCode(65 + optionIndex)}
                          </Text>
                          <Text style={styles.optionText}>{option}</Text>
                          {isCorrectAnswer && (
                            <CheckCircle size={16} color="#10B981" />
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <XCircle size={16} color="#DC2626" />
                          )}
                        </View>
                      );
                    })}
                  </View>
                  
                  <View style={styles.explanationContainer}>
                    <Text style={styles.explanationTitle}>Explanation:</Text>
                    <Text style={styles.explanationText}>{question.explanation}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  subscriptionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subscriptionStatus: {
    fontSize: 10,
    color: '#E5E7EB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 0.31,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  noResultsContainer: {
    marginBottom: 32,
  },
  noResultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  resultsContainer: {
    marginBottom: 32,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  resultDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  percentageText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBarContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
    marginLeft: 6,
  },
  tipsContainer: {
    marginBottom: 32,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  demoNoticeContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  demoNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  demoNoticeText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
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
  questionReview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  questionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 16,
  },
  optionsReview: {
    marginBottom: 16,
  },
  optionReview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  correctOption: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  wrongOption: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 12,
    minWidth: 20,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  explanationContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});