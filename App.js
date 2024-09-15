import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainScreen from './screens/MainScreen';
import CreatePost from './screens/CreatePost';
import Profile from './screens/Profile';
import Bookmarks from './screens/Bookmarks';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsLoggedIn(!!token); // If token exists, set isLoggedIn to true
      setLoading(false); // Set loading to false when the check is done
    };

    checkLoginStatus();
  }, []);

  if (loading) {
    return null; // Optionally, you can return a loading indicator here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'Main' : 'Login' }>
        <Stack.Screen name="Login" component={LoginScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="Register" component={RegisterScreen}/>
        <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="CreatePost" component={CreatePost} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Bookmarks" component={Bookmarks} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
