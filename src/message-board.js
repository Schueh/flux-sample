import { createStore, combineReducers, applyMiddleware } from 'redux';
import { get } from './http';
import logger from 'redux-logger';

const defaultState = {
    messages: [
        {
            date: new Date('2018-01-01 13:37:55'),
            postedBy: 'Manu',
            content: 'I love Redux'
        },
        {
            date: new Date('2018-01-02 15:39:11'),
            postedBy: 'Sam',
            content: 'I love Flux'
        }
    ],
    userStatus: 'ONLINE',
    apiCommunicationStatus: 'READY'
}

const apiCommunicationStatusReducer = (state = defaultState.apiCommunicationStatus, {type}) => {
    switch (type) {
        case 'CREATE_NEW_MESSAGE':
            return 'WAITING';
        case 'NEW_MESSAGE_SERVER_ACCEPTED':
            return 'READY';
    }

    return state;
}

const userStatusReducer = (state = defaultState.userStatus, {type, value}) => {
    switch (type) {
        case 'UPDATE_STATUS':
            return value;
    }

    return state; // a reducer always has to return a state !
}

// reducers just work on the necessary part of the state
const messagesReducer = (state = defaultState.messages, {type, value, postedBy, date}) => {
    switch (type) {
        case 'CREATE_NEW_MESSAGE':
            const newState = [{date, postedBy, content:value}, ... state]; // create a new message array with the new element and a copy of the existing ones
            return newState;
    }

    return state;
}

const combinedReducer = combineReducers({
    userStatus: userStatusReducer,
    messages: messagesReducer,
    apiCommunicationStatus: apiCommunicationStatusReducer
});

const store = createStore(combinedReducer, applyMiddleware(logger));

document.forms.newMessage.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = e.target.newMessage.value;
    const userName = localStorage.preferences ? JSON.parse(localStorage.preferences).userName : 'Jimbo';
    store.dispatch(newMessageAction(value, userName));
});

const render = () => {
    const { messages, userStatus, apiCommunicationStatus } = store.getState();
    const messagesHtml = messages
        .sort((a, b) => b.date - a.date)
        .map(message => (`
            <div>
                ${message.postedBy} : ${message.content}
            </div>
        `)).join('');
    document.getElementById('messages').innerHTML = messagesHtml;

    document.forms.newMessage.fields.disabled = (userStatus === 'OFFLINE' || apiCommunicationStatus === 'WAITING');
    document.forms.newMessage.newMessage.value = '';
}

const statusUpdateAction = (value) => {
    return {
        type: 'UPDATE_STATUS',
        value
    }
}

const newMessageAction = (content, postedBy) => {
    const date = new Date();

    get('/api/create', (id) => {
        store.dispatch({
            type: 'NEW_MESSAGE_SERVER_ACCEPTED',
            value: content,
            postedBy,
            date,
            id
        });
    });

    return {
        type: 'CREATE_NEW_MESSAGE',
        value: content,
        postedBy,
        date
    }
}

document.forms.selectStatus.status.addEventListener('change', (e) => {
    store.dispatch(statusUpdateAction(e.target.value));
});

render();

store.subscribe(render); // equal to Flux dispatcher.Register