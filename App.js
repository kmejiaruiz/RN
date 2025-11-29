// App.js - Updated with stock, timestamps, borrowUntil, and notifications

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './screens/HomeScreen';
import RegisterBookScreen from './screens/RegisterBookScreen';
import BookListScreen from './screens/BookListScreen';
import BookDetailScreen from './screens/BookDetailScreen';
import AdminDashboard from './screens/AdminDashboard';
import LoginScreen from './screens/LoginScreen';

// Hardcoded users for demo (in real app, use secure backend like Firebase Auth)
const users = [
  { id: '1', username: 'admin', password: 'admin', role: 'admin' },
  { id: '2', username: 'user', password: 'user', role: 'user' },
];

// Function to get user by ID
const getUserById = (id) => users.find(u => u.id === id) || { username: 'Unknown' };

// Create a stack navigator
const Stack = createNativeStackNavigator();

// Storage keys
const BOOKS_STORAGE_KEY = '@library_books';
const NOTIFICATIONS_STORAGE_KEY = '@library_notifications';

// Main App component
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Load books and notifications from AsyncStorage on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedBooks = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
        if (storedBooks) {
          setBooks(JSON.parse(storedBooks));
        }
        const storedNotifications = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedNotifications) {
          setNotifications(JSON.parse(storedNotifications));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Save books and notifications to AsyncStorage whenever they change
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
        await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };
    if (books.length > 0 || notifications.length > 0) {
      saveData();
    }
  }, [books, notifications]);

  // Function to add a new book (admin sets stock)
  const addBook = (newBook) => {
    const updatedBooks = [...books, {
      id: Date.now().toString(),
      status: 'available',
      requestedBy: null,
      borrowedBy: null,
      stock: newBook.stock || 1, // Default stock 1 if not set
      requestedAt: null,
      approvedAt: null,
      approvedBy: null,
      borrowUntil: null,
      ...newBook
    }];
    setBooks(updatedBooks);
  };

  // Function to update a book
  const updateBook = (updatedBook) => {
    const updatedBooks = books.map(book => book.id === updatedBook.id ? updatedBook : book);
    setBooks(updatedBooks);
  };

  // Function to delete a book
  const deleteBook = (id) => {
    const updatedBooks = books.filter(book => book.id !== id);
    setBooks(updatedBooks);
  };

  // Function to add notification
  const addNotification = (userId, message) => {
    setNotifications([...notifications, { id: Date.now().toString(), userId, message, read: false }]);
  };

  // Function to mark notifications as read
  const markNotificationsRead = (userId) => {
    const updatedNotifications = notifications.map(notif =>
      notif.userId === userId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
  };

  // Function to handle login
  const handleLogin = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return user.role;
    } else {
      alert('Credenciales inválidas');
      return null;
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login">
          {props => <LoginScreen {...props} handleLogin={handleLogin} />}
        </Stack.Screen>
        <Stack.Screen name="Home">
          {props => <HomeScreen {...props} currentUser={currentUser} handleLogout={handleLogout} notifications={notifications} markNotificationsRead={markNotificationsRead} />}
        </Stack.Screen>
        <Stack.Screen name="AdminDashboard">
          {props => <AdminDashboard {...props} books={books} updateBook={updateBook} currentUser={currentUser} handleLogout={handleLogout} getUserById={getUserById} addNotification={addNotification} />}
        </Stack.Screen>
        <Stack.Screen name="RegisterBook">
          {props => <RegisterBookScreen {...props} addBook={addBook} />}
        </Stack.Screen>
        <Stack.Screen name="BookList">
          {props => <BookListScreen {...props} books={books} deleteBook={deleteBook} currentUser={currentUser} />}
        </Stack.Screen>
        <Stack.Screen name="BookDetail">
          {props => <BookDetailScreen {...props} updateBook={updateBook} deleteBook={deleteBook} currentUser={currentUser} getUserById={getUserById} addNotification={addNotification} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;