import React from 'react'
import Chatkit from '@pusher/chatkit-client'
import MessageList from './components/MessageList'
import SendMessageForm from './components/SendMessageForm'
import RoomList from './components/RoomList'
import NewRoomForm from './components/NewRoomForm'
import ChatkitServer from '@pusher/chatkit-server';

import { tokenUrl, instanceLocator, secretKey } from './config'

class App extends React.Component {

    constructor() {
        super()
        this.state = {
            username:'',
            roomId: null,
            messages: [],
            joinableRooms: [],
            joinedRooms: []
        }
        this.sendMessage = this.sendMessage.bind(this)
        this.subscribeToRoom = this.subscribeToRoom.bind(this)
        this.getRooms = this.getRooms.bind(this)
        this.createRoom = this.createRoom.bind(this)
        this.handleUsername = this.handleUsername.bind(this)
    } 

    componentDidMount() {
        let usernameStore = localStorage.getItem('username-react-chat-app');
        
        if(!usernameStore || usernameStore === ''){
            this.handleUsername()
        }else{
            console.log('ni username: ',this.state.username);
            const chatManager = new Chatkit.ChatManager({
                instanceLocator,
                userId: usernameStore,
                tokenProvider: new Chatkit.TokenProvider({
                    url: tokenUrl
                })
            })
            
            chatManager.connect()
            .then(currentUser => {
                this.currentUser = currentUser
                this.getRooms()
            })
            .catch(err => console.log('error on connecting: ', err))
        }
    }

    handleUsername (){
        let username = localStorage.getItem('username-react-chat-app');
        if(!username || username ===''){

            let person = prompt("Please enter your name: ");
            localStorage.setItem('username-react-chat-app', person);

            const chatkit = new ChatkitServer({
                instanceLocator,
                key:secretKey
            })
            
            chatkit.createUser({
                id: person,
                name: person
            }).then((user) => {
                console.log('Success', user);
            }).catch((err) => {
                console.log(err);
            });
            
            this.setState( {
                username:person
            })
            window.location.reload();
        }else{
            this.setState( {
                username:username
            }) 
        }
    }
    
    getRooms() {
        this.currentUser.getJoinableRooms()
        .then(joinableRooms => {
            this.setState({
                joinableRooms,
                joinedRooms: this.currentUser.rooms
            })
        })
        .catch(err => console.log('error on joinableRooms: ', err))
    }
    
    subscribeToRoom(roomId) {
        this.setState({ messages: [] })
        this.currentUser.subscribeToRoom({
            roomId: roomId,
            hooks: {
                onMessage: message => {
                    this.setState({
                        messages: [...this.state.messages, message]
                    })
                }
            }
        })
        .then(room => {
            this.setState({
                roomId: room.id
            })
            this.getRooms()
        })
        .catch(err => console.log('error on subscribing to room: ', err))
    }
    
    sendMessage(text) {
        this.currentUser.sendMessage({
            text,
            roomId: this.state.roomId
        })
    }

    createRoom(newRoomName){
        this.currentUser.createRoom({
            name:newRoomName
        })
        .then(room => this.subscribeToRoom(room.id))
        .catch(err => console.log('error with createRoom: ', err))
    }
    
    render() {

        return (
            <div className="app">
                <RoomList
                    roomId={this.state.roomId}
                    subscribeToRoom={this.subscribeToRoom}
                    rooms={[...this.state.joinableRooms, ...this.state.joinedRooms]} />
                <MessageList 
                    messages={this.state.messages} 
                    roomId={this.state.roomId}
                />
                <SendMessageForm 
                    disabled={!this.state.roomId}
                    sendMessage={this.sendMessage} />
                <NewRoomForm createRoom={this.createRoom} />
            </div>
        )
    }
}

export default App