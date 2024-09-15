import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import axios from 'axios';
import echo from '../services/pusherService'; // Import your Echo instance
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

function MainScreen() {
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
        // Fetch initial data
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

        // Set up Pusher channels
        const channel = echo.channel('posts');
        channel.listen('PostCreated', (e) => setPosts((prevPosts) => [e.post, ...prevPosts]));
        channel.listen('LikeToggled', (e) => setPosts((prevPosts) =>
            prevPosts.map((post) => post.id === e.post.id ? { ...post, likes_count: e.likesCount } : post)
        ));
        channel.listen('PostUpdated', (e) => setPosts((prevPosts) =>
            prevPosts.map((post) => post.id === e.post.id ? { ...post, body: e.post.body } : post)
        ));
        channel.listen('PostDeleted', (e) => {
            setPosts((prevPosts) => prevPosts.filter((post) => post.id !== e.postId));
          });
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

    const createPost = async () => {
        const formData = new FormData();
        formData.append('body', body);
        if (image) {
            formData.append('image', image);
        }

        try {
            await axios.post('http://localhost:8000/api/posts', formData, {
                headers: {
                    Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setBody('');
            setImage(null);
        } catch (error) {
            console.error('Error creating post:', error);
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
            // Remove the deleted post from the local state
            setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleEditPost = (post) => {
        setEditingPostId(post.id);
        setEditBody(post.body);
        setShowMenu(null); // Close the menu when editing
    };

    const saveEditPost = async (postId) => {
        try {
            await axios.put(`http://localhost:8000/api/posts/${postId}`, { body: editBody }, {
                headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` },
            });
            // Update the post body in the local state
            setPosts((prevPosts) =>
                prevPosts.map((post) => post.id === postId ? { ...post, body: editBody } : post)
            );
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('CreatePost')} style={styles.iconButton}>
                    <FontAwesome name="plus" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconButton}>
                    <Ionicons name="person" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Bookmarks')} style={styles.iconButton}>
                    <MaterialCommunityIcons name="bookmark-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={posts}
                renderItem={({ item: post }) => (
                    <View key={post.id} style={styles.postContainer}>
                        <View style={styles.postHeader}>
                            <Text style={styles.username}>{post.user.name}</Text>
                            {userName === post.user.name && (
                                <TouchableOpacity onPress={() => toggleMenu(post.id)} style={styles.menuIcon}>
                                    <Ionicons name="md-more" size={24} color="black" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.postBody}>
                            {editingPostId === post.id ? (
                                <>
                                    <TextInput
                                        value={editBody}
                                        onChangeText={setEditBody}
                                        style={styles.editTextInput}
                                        multiline
                                    />
                                    <TouchableOpacity onPress={() => saveEditPost(post.id)} style={styles.saveButton}>
                                        <Text>Save</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text>{post.body}</Text>
                                    {post.image && <Image source={{ uri: `http://localhost:8000/storage/${post.image}` }} style={styles.postImage} />}
                                </>
                            )}
                        </View>
                        <View style={styles.postFooter}>
                            <TouchableOpacity onPress={() => toggleLike(post.id)} style={styles.actionButton}>
                                <FontAwesome name={likedPosts.has(post.id) ? 'heart' : 'heart-o'} size={24} color="black" />
                                <Text>{post.likes_count}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => toggleBookmark(post.id)} style={styles.actionButton}>
                                <FontAwesome name={bookmarkedPosts.has(post.id) ? 'bookmark' : 'bookmark-o'} size={24} color="black" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => toggleComments(post.id)} style={styles.actionButton}>
                                <FontAwesome name="comment-o" size={24} color="black" />
                                <Text>{comments[post.id]?.length || 0}</Text>
                            </TouchableOpacity>
                        </View>
                        {visibleComments.has(post.id) && (
                            <View style={styles.commentsSection}>
                                <FlatList
                                    data={comments[post.id]}
                                    renderItem={({ item: comment }) => (
                                        <View key={comment.id} style={styles.commentItem}>
                                            <Text><Text style={styles.commentUserName}>{comment.user.name}:</Text> {comment.body}</Text>
                                        </View>
                                    )}
                                />
                                <TextInput
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    placeholder="Add a comment"
                                    style={styles.commentTextInput}
                                />
                                <TouchableOpacity onPress={() => addComment(post.id)} style={styles.commentButton}>
                                    <Text>Comment</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {showMenu === post.id && userName === post.user.name && (
                            <View style={styles.menu}>
                                <TouchableOpacity onPress={() => handleDeletePost(post.id)} style={styles.menuItem}>
                                    <Text>Delete</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleEditPost(post)} style={styles.menuItem}>
                                    <Text>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
                keyExtractor={(item) => item.id.toString()}
            />
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
        marginBottom: 20
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

export default MainScreen;

  











// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import pusher from '../services/pusherService';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { FontAwesome, Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';

// const { width } = Dimensions.get('window');

// const MainScreen = () => {
//     const [posts, setPosts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const navigation = useNavigation();

//     const fetchPosts = async () => {
//         setLoading(true);
//         try {
//             const token = await AsyncStorage.getItem('token');
//             const response = await axios.get('http://localhost:8000/api/posts', {
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             setPosts(response.data.posts);
//         } catch (error) {
//             console.error(error);
//             setError('Failed to load posts');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const initializePusher = () => {
//         const channel = pusher.channel('posts');
//         channel.listen('PostCreated', (event) => {
//             setPosts((prevPosts) => [event.post, ...prevPosts]);
//             Alert.alert('New Post', 'A new post has been created!');
//         });

//         channel.listen('LikeToggled', (event) => {
//             setPosts((prevPosts) =>
//                 prevPosts.map(post =>
//                     post.id === event.post.id
//                         ? { ...post, likesCount: event.likesCount, userHasLiked: event.userHasLiked }
//                         : post
//                 )
//             );
//         });

//         return () => {
//             channel.stopListening('PostCreated');
//             channel.stopListening('LikeToggled');
//             pusher.leaveChannel('posts');
//         };
//     };

//     useEffect(() => {
//         fetchPosts();
//         const cleanup = initializePusher();
//         return cleanup;
//     }, []);

//     useFocusEffect(
//         useCallback(() => {
//             fetchPosts();
//         }, [])
//     );

//     const handleLikeToggle = async (postId, hasLiked) => {
//         try {
//             const token = await AsyncStorage.getItem('token');
//             const url = `http://localhost:8000/api/posts/${postId}/${hasLiked ? 'unlike' : 'like'}`;
//             const response = await axios.post(url, {}, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });

//             setPosts((prevPosts) =>
//                 prevPosts.map(post =>
//                     post.id === postId
//                         ? {
//                             ...post,
//                             likesCount: response.data.likesCount,
//                             userHasLiked: !hasLiked
//                         }
//                         : post
//                 )
//             );
//         } catch (error) {
//             console.error('Failed to toggle like:', error);
//         }
//     };

//     if (loading) {
//         return (
//             <View style={styles.container}>
//                 <Text>Loading...</Text>
//             </View>
//         );
//     }

//     if (error) {
//         return (
//             <View style={styles.container}>
//                 <Text>{error}</Text>
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             <View style={styles.header}>
//                 <TouchableOpacity onPress={() => navigation.navigate('CreatePost')} style={styles.iconButton}>
//                     <FontAwesome name="plus" size={24} color="#fff" />
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconButton}>
//                     <Ionicons name="person" size={24} color="#fff" />
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={() => navigation.navigate('Bookmarks')} style={styles.iconButton}>
//                     <MaterialCommunityIcons name="bookmark-outline" size={24} color="#fff" />
//                 </TouchableOpacity>
//             </View>
//             <ScrollView contentContainerStyle={styles.contentContainer} style={styles.scrollView}>
//                 {posts.map((item) => (
//                     <View key={item.id} style={styles.postContainer}>
//                         <View style={styles.postHeader}>
//                             <Text style={styles.creatorName}>{item.user.name || 'Unknown User'}</Text> {/* Имя пользователя */}
//                             <Text style={styles.postDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
//                         </View>
//                         <Text style={styles.postBody}>{item.body}</Text>
//                         {item.image && <Image source={{ uri: `http://localhost:8000/storage/${item.image}` }} style={styles.postImage} />}
//                         <View style={styles.postFooter}>
//                             <TouchableOpacity
//                                 style={styles.footerIcon}
//                                 onPress={() => handleLikeToggle(item.id, item.userHasLiked)}
//                             >
//                                 <Ionicons
//                                     name={item.userHasLiked ? "heart" : "heart-outline"}
//                                     size={20}
//                                     color={item.userHasLiked ? "#FF6F61" : "#757575"}
//                                 />
//                                 <Text>{item.likesCount}</Text>
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.footerIcon}>
//                                 <Entypo name="chat" size={20} color="#4CAF50" />
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.footerIcon}>
//                                 <MaterialCommunityIcons name="bookmark-outline" size={20} color="#3F51B5" />
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 ))}
//             </ScrollView>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#ECEFF1',
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingVertical: 15,
//         paddingHorizontal: 20,
//         backgroundColor: '#FF5722',
//         borderBottomLeftRadius: 25,
//         borderBottomRightRadius: 25,
//         shadowColor: '#000',
//         shadowOpacity: 0.4,
//         shadowOffset: { width: 0, height: 4 },
//         shadowRadius: 10,
//         elevation: 6,
//     },
//     iconButton: {
//         padding: 12,
//         borderRadius: 30,
//         backgroundColor: '#FFAB91',
//         shadowColor: '#000',
//         shadowOpacity: 0.3,
//         shadowOffset: { width: 0, height: 2 },
//         shadowRadius: 6,
//         elevation: 3,
//     },
//     postContainer: {
//         backgroundColor: '#ffffff',
//         marginVertical: 10,
//         marginHorizontal: 20,
//         borderRadius: 20,
//         overflow: 'hidden',
//         shadowColor: '#000',
//         shadowOpacity: 0.3,
//         shadowOffset: { width: 0, height: 8 },
//         shadowRadius: 12,
//         elevation: 6,
//         borderLeftWidth: 6,
//         borderLeftColor: '#FF6F61',
//     },
//     postHeader: {
//         padding: 16,
//         borderBottomWidth: 1,
//         borderBottomColor: '#EEEEEE',
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//     },
//     creatorName: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#212121',
//     },
//     postDate: {
//         fontSize: 12,
//         color: '#757575',
//     },
//     postBody: {
//         fontSize: 16,
//         padding: 16,
//         color: '#212121',
//         lineHeight: 24,
//     },
//     postImage: {
//         width: '100%',
//         height: 200,
//         resizeMode: 'cover',
//     },
//     postFooter: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         padding: 16,
//         borderTopWidth: 1,
//         borderTopColor: '#EEEEEE',
//         backgroundColor: '#FAFAFA',
//     },
//     footerIcon: {
//         padding: 8,
//     },
//     contentContainer: {
//         flexGrow: 1,
//         paddingBottom: 20,
//     },
//     scrollView: {
//         flex: 1,
//     },
// });

// export default MainScreen;









//=====================================================================================================================


// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import pusher from '../services/pusherService'; // Import the Pusher instance
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { FontAwesome, Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';

// const { width } = Dimensions.get('window');

// const MainScreen = () => {
//     const [posts, setPosts] = useState([]);
//     const navigation = useNavigation();

//     const fetchPosts = async () => {
//         try {
//             const token = await AsyncStorage.getItem('token');
//             const response = await axios.get('http://localhost:8000/api/posts', {
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             setPosts(response.data.posts);
//         } catch (error) {
//             console.error(error);
//         }
//     };

//     const initializePusher = () => {
//         const channel = pusher.channel('posts');
//         channel.listen('PostCreated', (event) => {
//             setPosts((prevPosts) => [event.post, ...prevPosts]);
//             Alert.alert('New Post', 'A new post has been created!');
//         });

//         return () => {
//             channel.stopListening('PostCreated');
//             pusher.leaveChannel('posts');
//         };
//     };

//     useEffect(() => {
//         fetchPosts();
//         const cleanup = initializePusher();
//         return cleanup;
//     }, []);

//     useFocusEffect(
//         useCallback(() => {
//             fetchPosts();
//         }, [])
//     );

//     const navigateToCreatePost = () => {
//         navigation.navigate('CreatePost');
//     };

//     const navigateToProfile = () => {
//         navigation.navigate('Profile');
//     };

//     const navigateToBookmarks = () => {
//         navigation.navigate('Bookmarks');
//     };

//     return (
//         <View style={styles.container}>
//             <View style={styles.header}>
//                 <TouchableOpacity onPress={navigateToCreatePost} style={styles.iconButton}>
//                     <FontAwesome name="plus" size={24} color="#fff" />
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={navigateToProfile} style={styles.iconButton}>
//                     <Ionicons name="person" size={24} color="#fff" />
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={navigateToBookmarks} style={styles.iconButton}>
//                     <MaterialCommunityIcons name="bookmark-outline" size={24} color="#fff" />
//                 </TouchableOpacity>
//             </View>
//             <FlatList
//                 data={posts}
//                 keyExtractor={(item) => item.id.toString()}
//                 renderItem={({ item }) => (
//                     <View style={styles.postContainer}>
//                         <View style={styles.postHeader}>
//                             <Text style={styles.creatorName}>{item.creatorName}</Text>
//                             <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
//                         </View>
//                         <Text style={styles.postBody}>{item.body}</Text>
//                         {item.image && <Image source={{ uri: `http://localhost:8000/storage/${item.image}` }} style={styles.postImage} />}
//                         <View style={styles.postFooter}>
//                             <TouchableOpacity style={styles.footerIcon}>
//                                 <Ionicons name="heart-outline" size={20} color="#FF6F61" />
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.footerIcon}>
//                                 <Entypo name="chat" size={20} color="#4CAF50" />
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.footerIcon}>
//                                 <MaterialCommunityIcons name="bookmark-outline" size={20} color="#3F51B5" />
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 )}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={styles.contentContainer}
//             />
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#ECEFF1',
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingVertical: 15,
//         paddingHorizontal: 20,
//         backgroundColor: '#FF5722',
//         borderBottomLeftRadius: 25,
//         borderBottomRightRadius: 25,
//         shadowColor: '#000',
//         shadowOpacity: 0.4,
//         shadowOffset: { width: 0, height: 4 },
//         shadowRadius: 10,
//         elevation: 6,
//     },
//     iconButton: {
//         padding: 12,
//         borderRadius: 30,
//         backgroundColor: '#FFAB91',
//         shadowColor: '#000',
//         shadowOpacity: 0.3,
//         shadowOffset: { width: 0, height: 2 },
//         shadowRadius: 6,
//         elevation: 3,
//     },
//     postContainer: {
//         backgroundColor: '#ffffff',
//         marginVertical: 10,
//         marginHorizontal: 20,
//         borderRadius: 20,
//         overflow: 'hidden',
//         shadowColor: '#000',
//         shadowOpacity: 0.3,
//         shadowOffset: { width: 0, height: 8 },
//         shadowRadius: 12,
//         elevation: 6,
//         borderLeftWidth: 6,
//         borderLeftColor: '#FF6F61',
//     },
//     postHeader: {
//         padding: 16,
//         borderBottomWidth: 1,
//         borderBottomColor: '#EEEEEE',
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//     },
//     creatorName: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#212121',
//     },
//     postDate: {
//         fontSize: 12,
//         color: '#757575',
//     },
//     postBody: {
//         fontSize: 16,
//         padding: 16,
//         color: '#212121',
//         lineHeight: 24,
//     },
//     postImage: {
//         width: '100%',
//         height: 200,
//         resizeMode: 'cover',
//     },
//     postFooter: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         padding: 16,
//         borderTopWidth: 1,
//         borderTopColor: '#EEEEEE',
//         backgroundColor: '#FAFAFA',
//     },
//     footerIcon: {
//         padding: 8,
//     },
//     contentContainer: {
//         paddingBottom: 20,
//     },
// });

// export default MainScreen;
