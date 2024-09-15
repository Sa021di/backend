import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import axios from 'axios';
import echo from '../services/pusherService'; // Import your Echo instance
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

function CreatePost() { 
    const navigation = useNavigation(); // Use the useNavigation hook
    const [posts, setPosts] = useState([]);
    const [body, setBody] = useState('');
    const [image, setImage] = useState(null);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
    const [userName, setUserName] = useState('');
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState({});
    const [visibleComments, setVisibleComments] = useState(new Set());
    const [showMenu, setShowMenu] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editBody, setEditBody] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userResponse = await axios.get('http://localhost:8000/api/user', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUserName(userResponse.data.name);

                const postsResponse = await axios.get('http://localhost:8000/api/posts', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setPosts(postsResponse.data.posts);
                setLikedPosts(new Set(postsResponse.data.likedPosts));

                const storedBookmarkedPosts = JSON.parse(await AsyncStorage.getItem('bookmarkedPosts')) || [];
                setBookmarkedPosts(new Set(storedBookmarkedPosts));

                const commentsData = {};
                for (const post of postsResponse.data.posts) {
                    const commentsResponse = await axios.get(`http://localhost:8000/api/posts/${post.id}/comments`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    commentsData[post.id] = commentsResponse.data.comments;
                }
                setComments(commentsData);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };
        fetchInitialData();

        const channel = echo.channel('posts');
        channel.listen('PostCreated', (e) => setPosts((prevPosts) => [e.post, ...prevPosts]));
        channel.listen('LikeToggled', (e) => setPosts((prevPosts) =>
            prevPosts.map((post) => post.id === e.post.id ? { ...post, likes_count: e.likesCount } : post)
        ));
        channel.listen('PostUpdated', (e) => setPosts((prevPosts) =>
            prevPosts.map((post) => post.id === e.post.id ? { ...post, body: e.post.body } : post)
        ));
        channel.listen('PostDeleted', (e) => setPosts((prevPosts) => prevPosts.filter((post) => post.id !== e.post.id)));
        channel.listen('CommentCreated', (e) => setComments((prevComments) => ({
            ...prevComments,
            [e.comment.post_id]: [e.comment, ...(prevComments[e.comment.post_id] || [])],
        })));

        return () => {
            channel.stopListening('PostCreated');
            channel.stopListening('LikeToggled');
            channel.stopListening('PostUpdated');
            channel.stopListening('PostDeleted');
            channel.stopListening('CommentCreated');
        };
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
    
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedImage = result.assets[0];
            setImage({
                uri: selectedImage.uri,
                name: selectedImage.uri.split('/').pop(),
                // type: selectedImage.type || 'image/jpeg/jpg/png', // Дефолтное значение типа
            });
        } else {
            // Обработка случая, когда пользователь отменяет выбор изображения
            console.log('Image picking was canceled or no image selected.');
        }
    };

    const createPost = async () => {
        const formData = new FormData();
        formData.append('body', body);
        if (image) {
            formData.append('image', {
                uri: image.uri,
                name: image.name,
                type: image.type || 'jpeg/jpg/png',  // Ensure a default type if none provided
            });
        }
    
        try {
            const response = await axios.post('http://localhost:8000/api/posts', formData, {
                headers: {
                    Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setBody('');
            setImage(null);
            console.log('Post created successfully:', response.data);
        } catch (error) {
            console.error('Error creating post:', error.response ? error.response.data : error.message);
        }
    };
    

    const toggleLike = async (postId) => {
        try {
            const response = await axios.post(`http://localhost:8000/api/posts/${postId}/like`, {}, {
                headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` },
            });
            const { likesCount } = response.data;

            setPosts((prevPosts) => prevPosts.map((post) => post.id === postId ? { ...post, likes_count: likesCount } : post));
            setLikedPosts((prevLikedPosts) => {
                const updatedLikedPosts = new Set(prevLikedPosts);
                if (updatedLikedPosts.has(postId)) updatedLikedPosts.delete(postId);
                else updatedLikedPosts.add(postId);
                return updatedLikedPosts;
            });
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const toggleBookmark = async (postId) => {
        try {
            const isBookmarked = bookmarkedPosts.has(postId);
            const url = `http://localhost:8000/api/posts/${postId}/${isBookmarked ? 'unbookmark' : 'bookmark'}`;
            await axios.post(url, {}, { headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` } });

            const updatedBookmarkedPosts = new Set(bookmarkedPosts);
            if (isBookmarked) updatedBookmarkedPosts.delete(postId);
            else updatedBookmarkedPosts.add(postId);

            setBookmarkedPosts(updatedBookmarkedPosts);
            await AsyncStorage.setItem('bookmarkedPosts', JSON.stringify([...updatedBookmarkedPosts]));
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const addComment = async (postId) => {
        try {
            await axios.post(`http://localhost:8000/api/posts/${postId}/comments`, { body: newComment }, {
                headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` },
            });
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await axios.delete(`http://localhost:8000/api/posts/${postId}`, {
                headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` },
            });
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleEditPost = (post) => {
        setEditingPostId(post.id);
        setEditBody(post.body);
    };

    const saveEditPost = async (postId) => {
        try {
            await axios.put(`http://localhost:8000/api/posts/${postId}`, { body: editBody }, {
                headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` },
            });
            setEditingPostId(null);
            setEditBody('');
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    const toggleComments = (postId) => {
        setVisibleComments((prevVisibleComments) => {
            const updatedVisibleComments = new Set(prevVisibleComments);
            if (updatedVisibleComments.has(postId)) updatedVisibleComments.delete(postId);
            else updatedVisibleComments.add(postId);
            return updatedVisibleComments;
        });
    };

    const toggleMenu = (postId) => {
        setShowMenu((prevShowMenu) => (prevShowMenu === postId ? null : postId));
    };

    return (
        <View style={styles.container}>
            <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="What's on your mind?"
                style={styles.textInput}
                multiline
            />
            <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                <Text>Upload Image</Text>
            </TouchableOpacity>
            {image && <Text>{image.name}</Text>}
            <TouchableOpacity onPress={createPost} style={styles.postButton}>
                <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#FF5722',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 6,
    },
    textInput: {
        height: 100,
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#ffffff',
        marginBottom: 8,
        textAlignVertical: 'top',
    },
    imagePickerButton: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    imagePickerText: {
        color: '#ffffff',
        fontSize: 16,
    },
    postButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    postButtonText: {
        color: '#ffffff',
        fontSize: 16,
    },
    imageName: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 16,
    },
    postContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#343a40',
    },
    menuIcon: {
        marginLeft: 'auto',
    },
    postBody: {
        marginBottom: 8,
    },
    editTextInput: {
        height: 100,
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#ffffff',
        marginBottom: 8,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#28a745',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#ffffff',
    },
    postText: {
        fontSize: 16,
        color: '#495057',
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: 8,
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    actionCount: {
        marginLeft: 4,
        color: '#495057',
    },
    commentsSection: {
        marginTop: 8,
    },
    commentItem: {
        padding: 8,
        borderBottomColor: '#ced4da',
        borderBottomWidth: 1,
    },
    commentUserName: {
        fontWeight: 'bold',
    },
    commentTextInput: {
        height: 40,
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#ffffff',
        marginBottom: 8,
    },
    commentButton: {
        backgroundColor: '#007bff',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    commentButtonText: {
        color: '#ffffff',
    },
});

export default CreatePost;



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as ImagePicker from 'react-native-image-picker';
// import echo from '../services/pusherService'; // Import Echo instance

// const CreatePost = ({ navigation }) => {
//     const [body, setBody] = useState('');
//     const [image, setImage] = useState(null);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     let channel;

//     useEffect(() => {
//         channel = echo.channel('posts');
//         channel.listen('PostCreated', (event) => {
//             console.log('New post received:', event.post);
//             Alert.alert('New Post', 'A new post has been created!');
//         });

//         return () => {
//             if (channel) {
//                 channel.stopListening('PostCreated');
//                 echo.leaveChannel('posts');
//             }
//         };
//     }, []);

//     const pickImage = () => {
//         ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
//             if (response.assets && response.assets.length > 0) {
//                 setImage(response.assets[0].uri);
//             }
//         });
//     };

//     const createPost = async () => {
//         setIsSubmitting(true);
//         try {
//             const token = await AsyncStorage.getItem('token');
//             const formData = new FormData();
//             formData.append('body', body);

//             if (image) {
//                 formData.append('image', {
//                     uri: image,
//                     type: 'image/jpeg/jpg/png',
//                      name: 'post-image.jpg',
//                 });
//             }

//             const response = await axios.post('http://localhost:8000/api/posts', formData, {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     'Content-Type': 'multipart/form-data',
//                 },
//             });

//             console.log('Post created successfully:', response.data);
//             Alert.alert('Success', 'Post created successfully!');
//             navigation.navigate('Main', { refresh: true });
//         } catch (error) {
//             console.error('Error creating post:', error);
//             Alert.alert('Error', 'Failed to create post.');
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Create a New Post</Text>
//             <TextInput
//                 style={styles.input}
//                 placeholder="Enter post body"
//                 value={body}
//                 onChangeText={setBody}
//                 multiline
//             />
//             <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
//                 <Text style={styles.imagePickerText}>Pick an Image</Text>
//             </TouchableOpacity>
//             {image && <Image source={{ uri: image }} style={styles.image} />}
//             <TouchableOpacity
//                 style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
//                 onPress={createPost}
//                 disabled={isSubmitting}
//             >
//                 {isSubmitting ? (
//                     <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                     <Text style={styles.submitButtonText}>Create Post</Text>
//                 )}
//             </TouchableOpacity>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 20,
//         backgroundColor: '#f5f5f5',
//         // justifyContent: 'center',
//     },
//     title: {
//         fontSize: 28,
//         fontWeight: 'bold',
//         color: '#333',
//         marginBottom: 20,
//         textAlign: 'center',
//     },
//     input: {
//         height: 120,
//         borderColor: '#ddd',
//         borderWidth: 1,
//         borderRadius: 10,
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         backgroundColor: '#fff',
//         marginBottom: 20,
//         textAlignVertical: 'top',
//         fontSize: 16,
//         color: '#333',
//     },
//     imagePickerButton: {
//         backgroundColor: '#007bff',
//         paddingVertical: 12,
//         borderRadius: 10,
//         marginBottom: 20,
//         alignItems: 'center',
//     },
//     imagePickerText: {
//         color: '#fff',
//         fontSize: 16,
//         fontWeight: '600',
//     },
//     image: {
//         width: '100%',
//         height: 200,
//         borderRadius: 10,
//         marginBottom: 20,
//     },
//     submitButton: {
//         backgroundColor: '#28a745',
//         paddingVertical: 12,
//         borderRadius: 10,
//         alignItems: 'center',
//     },
//     submitButtonDisabled: {
//         backgroundColor: '#6c757d',
//     },
//     submitButtonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontWeight: '600',
//     },
// });

// export default CreatePost;


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////









//    ===========================================================================================================================================
//    ==============================================IKKINCHISI =============================================================================================
//    ===========================================================================================================================================


// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import echo from '../services/pusherService'; // Import Echo instance

// const CreatePost = ({ navigation }) => {
//     const [body, setBody] = useState('');
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     let channel;

//     useEffect(() => {
//         const initializePusher = () => {
//             // Subscribe to the 'posts' channel
//             channel = echo.channel('posts');
//             channel.listen('PostCreated', (event) => {
//                 console.log('New post received:', event.post);
//                 Alert.alert('New Post', 'A new post has been created!');
//             });
//         };

//         initializePusher();

//         return () => {
//             // Unsubscribe from the channel when the component unmounts
//             if (channel) {
//                 channel.stopListening('PostCreated');
//                 echo.leaveChannel('posts'); // This leaves the channel and unsubscribes
//             }
//         };
//     }, []);

//     const createPost = async () => {
//         setIsSubmitting(true);
//         try {
//             const token = await AsyncStorage.getItem('token');
//             const response = await axios.post('http://localhost:8000/api/posts', {
//                 body,
//             }, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });

//             console.log('Post created successfully:', response.data);
//             Alert.alert('Success', 'Post created successfully!');
//             navigation.navigate('Main', { refresh: true });
//         } catch (error) {
//             console.error('Error creating post:', error);
//             Alert.alert('Error', 'Failed to create post.');
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Create a New Post</Text>
//             <TextInput
//                 style={styles.input}
//                 placeholder="Enter post body"
//                 value={body}
//                 onChangeText={setBody}
//             />
//             <Button
//                 title={isSubmitting ? 'Submitting...' : 'Create Post'}
//                 onPress={createPost}
//                 disabled={isSubmitting}
//             />
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 16,
//         justifyContent: 'center',
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 16,
//     },
//     input: {
//         height: 100,
//         borderColor: '#ccc',
//         borderWidth: 1,
//         marginBottom: 16,
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         textAlignVertical: 'top',
//     },
// });

// export default CreatePost;



//    ===========================================================================================================================================
//    ==============================================BIRINCHISI =============================================================================================
//    ===========================================================================================================================================

// import React, { useEffect, useState } from 'react';
    // import { View, Text, TextInput, Button, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
    // import axios from 'axios';
    // import * as ImagePicker from 'expo-image-picker';
    // import Pusher from '@pusher/pusher-websocket-react-native';
    // import AsyncStorage from '@react-native-async-storage/async-storage';

    // const CreatePost = ({ navigation }) => {
    //     const [body, setBody] = useState('');
    //     const [image, setImage] = useState(null);
    //     const [token, setToken] = useState('');
    //     const [notification, setNotification] = useState('');

    //     useEffect(() => {
    //         const initializePusher = async () => {
    //             // Fetch token from AsyncStorage
    //             try {
    //                 const storedToken = await AsyncStorage.getItem('token');
    //                 if (storedToken) {
    //                     setToken(storedToken);
    //                 } else {
    //                     console.warn('Token not found');
    //                 }
    //             } catch (error) {
    //                 console.error('Error fetching token:', error);
    //             }

    //             // Initialize Pusher
    //             const pusher = Pusher.getInstance();
    //             await pusher.init({
    //                 apiKey: "5d7ca606717d5c61446a",
    //                 cluster: "mt1"
    //             });

    //             const channel = pusher.subscribe('posts');
    //             channel.bind('PostCreated', (data) => {
    //                 console.log('Post created:', data.post);
    //                 setNotification('A new post has been created!');
    //                 Alert.alert('New Post', 'A new post has been created!');
    //             });

    //             // Cleanup Pusher on component unmount
    //             return () => {
    //                 channel.unbind_all();
    //                 pusher.unsubscribe('posts');
    //             };
    //         };

    //         initializePusher();
    //     }, []);

    //     const handleImagePick = async () => {
    //         let result = await ImagePicker.launchImageLibraryAsync({
    //             mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //             allowsEditing: true,
    //             aspect: [4, 3],
    //             quality: 1,
    //         });

    //         if (!result.canceled) {
    //             setImage(result.uri);
    //         }
    //     };

    //     const createPost = async () => {
    //         const formData = new FormData();
    //         formData.append('body', body);
    //         if (image) {
    //             formData.append('image', {
    //                 uri: image,
    //                 type: 'image/jpeg',
    //                 name: 'photo.jpg',
    //             });
    //         }

    //         try {
    //             const response = await axios.post(
    //                 'http://localhost:8000/api/posts',
    //                 formData,
    //                 {
    //                     headers: {
    //                         Authorization: `Bearer ${token}`,
    //                         'Content-Type': 'multipart/form-data',
    //                     },
    //                 }
    //             );
    //             console.log('Post created successfully:', response.data);
    //             setBody('');
    //             setImage(null);
    //             navigation.goBack();
    //         } catch (error) {
    //             console.error('Error creating post:', error);
    //             Alert.alert('Error', 'Failed to create post. Please try again.');
    //         }
    //     };

    //     return (
    //         <ScrollView contentContainerStyle={styles.container}>
    //             {notification ? <Text style={styles.notification}>{notification}</Text> : null}
    //             <TextInput
    //                 value={body}
    //                 onChangeText={setBody}
    //                 placeholder="What's on your mind?"
    //                 style={styles.textarea}
    //                 multiline
    //             />
    //             <TouchableOpacity onPress={handleImagePick} style={styles.button}>
    //                 <Text style={styles.buttonText}>Upload Image</Text>
    //             </TouchableOpacity>
    //             {image && <Image source={{ uri: image }} style={styles.image} />}
    //             <Button title="Post" onPress={createPost} />
    //         </ScrollView>
    //     );
    // };

    // const styles = StyleSheet.create({
    //     container: {
    //         flex: 1,
    //         padding: 16,
    //     },
    //     textarea: {
    //         height: 100,
    //         borderColor: '#ccc',
    //         borderWidth: 1,
    //         padding: 8,
    //         marginBottom: 16,
    //     },
    //     button: {
    //         backgroundColor: '#007BFF',
    //         padding: 10,
    //         marginBottom: 16,
    //         borderRadius: 5,
    //     },
    //     buttonText: {
    //         color: '#fff',
    //         textAlign: 'center',
    //     },
    //     image: {
    //         width: 200,
    //         height: 200,
    //         marginBottom: 16,
    //         alignSelf: 'center',
    //     },
    //     notification: {
    //         padding: 10,
    //         backgroundColor: '#d4edda',
    //         color: '#155724',
    //         marginBottom: 16,
    //         borderRadius: 5,
    //         textAlign: 'center',
    //     },
    // });

    // export default CreatePost;
