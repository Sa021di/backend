import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

function Profile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [avatar, setAvatar] = useState(null);
  const navigation = useNavigation();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(response.data.name);
        setEmail(response.data.email);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirmation', passwordConfirmation);
    if (avatar) {
      formData.append('avatar', {
        uri: avatar.uri,
        type: avatar.type,
        name: avatar.fileName,
      });
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post('http://localhost:8000/api/user/update', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage(response.data.message);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleFileChange = () => {
    launchImageLibrary({}, (response) => {
      if (!response.didCancel && !response.errorCode) {
        setAvatar(response.assets[0]);
      }
    });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <FontAwesome name="sign-out" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>
      {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          secureTextEntry
        />
        <TouchableOpacity style={styles.avatarButton} onPress={handleFileChange}>
          <Text style={styles.avatarButtonText}>Select Avatar</Text>
        </TouchableOpacity>
        {avatar && <Image source={{ uri: avatar.uri }} style={styles.avatar} />}
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>Update Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#ff6b6b',
    borderRadius: 25,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  successMessage: {
    color: '#28a745',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  form: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    marginTop: 20,
  },
  input: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  avatarButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignSelf: 'center',
    marginBottom: 20,
    borderColor: '#6c5ce7',
    borderWidth: 3,
  },
  updateButton: {
    backgroundColor: '#00b894',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Profile;








//================================================================================================================

//   import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, Button, Alert, Image, StyleSheet, TouchableOpacity } from 'react-native';
// import axios from 'axios';
// import { useNavigation } from '@react-navigation/native';
// import { launchImageLibrary } from 'react-native-image-picker';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { FontAwesome } from '@expo/vector-icons';

// function Profile() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [passwordConfirmation, setPasswordConfirmation] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [avatar, setAvatar] = useState(null);
//   const navigation = useNavigation();

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         const response = await axios.get('http://localhost:8000/api/user', {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setName(response.data.name);
//         setEmail(response.data.email);
//       } catch (error) {
//         console.error('Error fetching user data:', error);
//       }
//     };

//     fetchUserData();
//   }, []);

//   const handleUpdate = async () => {
//     const formData = new FormData();
//     formData.append('name', name);
//     formData.append('email', email);
//     formData.append('password', password);
//     formData.append('password_confirmation', passwordConfirmation);
//     if (avatar) {
//       formData.append('avatar', {
//         uri: avatar.uri,
//         type: avatar.type,
//         name: avatar.fileName,
//       });
//     }

//     try {
//       const token = await AsyncStorage.getItem('token');
//       const response = await axios.post('http://localhost:8000/api/user/update', formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       setSuccessMessage(response.data.message);
//       // Update user context or state as needed
//     } catch (error) {
//       console.error('Error updating profile:', error);
//     }
//   };

//   const handleFileChange = () => {
//     launchImageLibrary({}, (response) => {
//       if (!response.didCancel && !response.errorCode) {
//         setAvatar(response.assets[0]);
//       }
//     });
//   };

//   const handleBackClick = () => {
//     navigation.navigate('CreatePosts');
//   };

//   const handleLogout = async () => {
//     await AsyncStorage.removeItem('token');
//     navigation.navigate('Login');
//   };

//   return (
//     <View style={styles.container}>
//      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
//            <FontAwesome name="sign-out" size={24} color="black" />
//       </TouchableOpacity>
//       <Text style={styles.title}>Profile</Text>
//       {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}
//       <View style={styles.form}>
//         <TextInput
//           style={styles.input}
//           placeholder="Name"
//           value={name}
//           onChangeText={setName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Email"
//           value={email}
//           onChangeText={setEmail}
//           keyboardType="email-address"
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Password"
//           value={password}
//           onChangeText={setPassword}
//           secureTextEntry
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Confirm Password"
//           value={passwordConfirmation}
//           onChangeText={setPasswordConfirmation}
//           secureTextEntry
//         />
//         <Button title="Select Avatar" onPress={handleFileChange} />
//         {avatar && <Image source={{ uri: avatar.uri }} style={styles.avatar} />}
//         <Button title="Update Profile" onPress={handleUpdate} />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#fff',
//   },
//   backButton: {
//     marginBottom: 16,
//   },
//   backButtonText: {
//     fontSize: 16,
//     color: '#007bff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   successMessage: {
//     color: 'green',
//     marginBottom: 16,
//   },
//   form: {
//     flex: 1,
//   },
//   input: {
//     height: 40,
//     borderColor: '#ddd',
//     borderWidth: 1,
//     marginBottom: 16,
//     paddingHorizontal: 8,
//   },
//   avatar: {
//     width: 100,
//     height: 100,
//     resizeMode: 'cover',
//     marginBottom: 16,
//   },
// });

// export default Profile;


//=======================================================================================================================================


// import React from 'react';
// import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { FontAwesome } from '@expo/vector-icons';

// const Profile = () => {
//   const navigation = useNavigation();

//   const handleLogout = async () => {
//     try {
//       await AsyncStorage.removeItem('token');
//       navigation.navigate('Login');
//     } catch (error) {
//       console.error('Error logging out:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Profile</Text>
//         <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
//           <FontAwesome name="sign-out" size={24} color="black" />
//         </TouchableOpacity>
//       </View>
//       {/* Add profile details here */}
//       <Text>Profile Details Go Here</Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 24,
//   },
//   logoutButton: {
//     padding: 8,
//   },
// });

// export default Profile;
