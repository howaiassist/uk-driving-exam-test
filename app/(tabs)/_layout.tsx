import { Tabs } from 'expo-router';
import { BookOpen, User, Trophy, LogOut } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { router } from 'expo-router';

export default function TabLayout() {
  const { logout, isDemoUser } = useUser();

  const handleLogout = async () => {
    try {
      const { Alert } = require('react-native');
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            onPress: async () => {
              try {
                await logout();
                router.replace('/login');
              } catch (error) {
                console.error('Logout error:', error);
                router.replace('/login');
              }
            }
          },
        ]
      );
    } catch (error) {
      console.log('Alert error, proceeding with logout:', error);
      logout().then(() => {
        router.replace('/login');
      }).catch((error) => {
        console.error('Direct logout error:', error);
        router.replace('/login');
      });
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1D4ED8',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
          href: isDemoUser ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Results',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={size} color={color} />
          ),
          href: isDemoUser ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Logout',
          tabBarIcon: ({ size, color }) => (
            <LogOut size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Tabs>
  );
}