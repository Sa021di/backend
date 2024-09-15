import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

window.Pusher = Pusher;

const pusher = new Echo({
    broadcaster: 'pusher',
    key: 'e7f332b087372a92d028',
    cluster: 'mt1',
    secret: 'a8eabfa9975efd3a285b',
    wsHost: '127.0.0.1',
    wsPort: 6001,
    forceTLS: false,
});

pusher.connector.pusher.connection.bind('state_change', (states) => {
    console.log('Pusher state change:', states);
});

pusher.connector.pusher.connection.bind('error', (error) => {
    console.error('Pusher error:', error);
});

export default pusher;


// import Pusher from 'pusher-js';

// const pusher = new Pusher('5b3b069a9690de534eed', {
//     cluster: 'mt1'
// });

// export default pusher;
