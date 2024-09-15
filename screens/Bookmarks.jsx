import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, Image, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome'; 

function Bookmarks() {
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [userName, setUserName] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/bookmarked-posts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookmarkedPosts(response.data.posts);
      } catch (error) {
        console.error('Error fetching bookmarked posts:', error);
      }
    };
  
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserName(response.data.name);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
  
    fetchBookmarkedPosts();
    fetchUser();
  }, []);

  const handleBackClick = () => {
    navigation.navigate('CreatePost');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.navigate('Login');
  };

  const handleUnbookmark = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/posts/${postId}/unbookmark`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookmarkedPosts((prevPosts) => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error unbookmarking post:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerText}>Hello, {userName}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View> */}

      {/* <TouchableOpacity onPress={handleBackClick} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity> */}

      <Text style={styles.title}>Bookmarked Posts</Text>
      <FlatList
        data={bookmarkedPosts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.postItem}>
            <Text style={styles.postUser}>
              {item.user ? item.user.name : 'Unknown'}
            </Text>
            <Text style={styles.postBody}>{item.body}</Text>
            {item.image && (
              <Image
                source={{ uri: `http://localhost:8000/storage/${item.image}` }}
                style={styles.postImage}
              />
            )}
            <TouchableOpacity onPress={() => handleUnbookmark(item.id)} style={styles.unbookmarkButton}>
              {/* <Text style={styles.unbookmarkButtonText}>Unbookmark</Text> */}
              <Icon name="bookmark-o" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f8fc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff5c5c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#ff5c5c',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginBottom: 24,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  postItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  postUser: {
    fontSize: 18,
    fontWeight: '700',
    color: '#555',
    marginBottom: 10,
  },
  postBody: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 10,
    marginBottom: 10,
  },
  unbookmarkButton: {
    backgroundColor: '#f39c12',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
    shadowColor: '#f39c12',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  unbookmarkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Bookmarks;




//----------------------------------------------------------------


// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, Button, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
// import axios from 'axios';
// import { useNavigation } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Не забудьте импортировать AsyncStorage

// function Bookmarks() {
//   const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
//   const [userName, setUserName] = useState('');
//   const navigation = useNavigation();

//   useEffect(() => {
//     const fetchBookmarkedPosts = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         const response = await axios.get('http://localhost:8000/api/bookmarked-posts', {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setBookmarkedPosts(response.data.posts);
//       } catch (error) {
//         console.error('Error fetching bookmarked posts:', error);
//       }
//     };

//     const fetchUser = async () => { 
//       try {
//         const token = await AsyncStorage.getItem('token');
//         const response = await axios.get('http://localhost:8000/api/user', {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setUserName(response.data.name);
//       } catch (error) {
//         console.error('Error fetching user data:', error);
//       }
//     };

//     fetchBookmarkedPosts();
//     fetchUser();
//   }, []);

//   const handleLogout = async () => {
//     await AsyncStorage.removeItem('token');
//     navigation.navigate('Login');
//   };

//   const handleUnbookmark = async (postId) => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       await axios.post(`http://localhost:8000/api/posts/${postId}/unbookmark`, {}, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setBookmarkedPosts((prevPosts) => prevPosts.filter(post => post.id !== postId));
//     } catch (error) {
//       console.error('Error unbookmarking post:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerText}>Hello, {userName}</Text>
//         <Button title="Logout" onPress={handleLogout} />
//       </View>

//       <Button title="Back" onPress={() => navigation.navigate('CreatePost')} />

//       <Text style={styles.title}>Bookmarked Posts</Text>
//       <FlatList
//         data={bookmarkedPosts}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={({ item }) => (
//           <View style={styles.postItem}>
//             <Text style={styles.postUser}>
//               USER: {item.user ? item.user.name : 'Unknown'}
//             </Text>
//             <Text style={styles.postBody}>{item.body}</Text>
//             {item.image && (
//               <Image
//                 source={{ uri: `http://localhost:8000/storage/${item.image}` }}
//                 style={styles.postImage}
//               />
//             )}
//             <TouchableOpacity onPress={() => handleUnbookmark(item.id)}>
//               <Text style={styles.unbookmarkButton}>Unbookmark</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       />
//     </View>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   headerText: {
//     fontSize: 18,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   postItem: {
//     padding: 16,
//     marginBottom: 16,
//     backgroundColor: '#f9f9f9',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ddd',
//   },
//   postUser: {
//     fontStyle: 'italic',
//   },
//   postBody: {
//     marginVertical: 8,
//   },
//   postImage: {
//     width: '100%',
//     height: 200,
//     resizeMode: 'cover',
//     marginVertical: 8,
//   },
//   unbookmarkButton: {
//     color: 'red',
//     textAlign: 'center',
//     marginTop: 8,
//   },
// });

// export default Bookmarks;



// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'

// const Bookmarks = () => {
//   return (
//     <View>
//       <Text>Bookmarks</Text>
//     </View>
//   )
// }

// export default Bookmarks

// const styles = StyleSheet.create({})