import React, { Component } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import { Button, Input, Navbar, ChatList, MessageList } from 'react-chat-elements';
import axios from 'axios';
import { Container, Row, Col } from 'react-grid-system';
import Peer from 'peerjs';
import Steg from './libs/steganography.min.js';
import LightImage from './assets/lights.jpg';

export default class App extends Component {
  static SERVER_HOST = 'localhost:9000';
  stegImage = new Image();
  static peer = null;
  state = {
    isLoggedIn: false,
    stegLoaded: false,
    user: {},
    selectedChat: '###Messages###',
    chats: [],
    messages: []
  }


  handleLogin = ({ username, password }) => {
    axios.post(`http://${App.SERVER_HOST}/login`, {
      username,
      password
    }).then((res) => {
      alert(res.data.response);
      this.setState({
        isLoggedIn: true,
        user: { username, password }
      }, () => {
        this.peer = new Peer(username, {
          host: 'localhost',
          port: 9000,
          path: '/api'
        });
        this.peer.on('connection', (conn) => {
          conn.on('data', this.handleRecMessage);
        });

      });
    }).catch((err) => {
      alert(err.response.data.response);
    })
  }

  handleSignup = ({ username, password, passwordConfirmation }) => {
    if (password !== passwordConfirmation) {
      return alert('Passwords don\'t match.');
    }

    axios.post(`http://${App.SERVER_HOST}/signup`, {
      username,
      password
    }).then((res) => {
      alert(res.data.response);
    }).catch((err) => {
      alert(err.response.data.response);
    });
  }

  personSelected = (p) => {
    const newChats = [...this.state.chats];
    const idx = newChats.indexOf(p);
    newChats[idx].unread = 0;
    this.setState({
      selectedChat: p.title,
      chats: newChats
    });
  }

  componentDidMount() {
    this.stegImage.src = LightImage;
    this.stegImage.onload = () => {
      this.setState({
        stegLoaded: true
      });
    }

    setTimeout(() => {
      this.refreshActiveUsers();
    }, 3000);
  }

  refreshActiveUsers = () => {
    axios
      .get(`http://${App.SERVER_HOST}/peers`)
      .then((resp) => {
        const clients = resp.data.clients;
        const newChatClients = [];
        newChatClients.push({
          title: '###LOBY###',
          subtitle: 'Messages from the Lobby!',
          date: new Date(),
          unread: 0,
        });
        clients.forEach((client) => {
          if (client !== this.state.user.username) {
            const newClient = {};
            newClient['title'] = client;
            newClient['subtitle'] = `Talk to ${client}`;
            newClient['date'] = new Date();
            newClient['unread'] = 0;
            newChatClients.push(newClient);
          }
        });

        this.setState({
          chats: newChatClients
        })
      })
  };

  getMessages = () => {
    let msgs = [...this.state.messages];
    const selectedChat = this.state.selectedChat;
    if (selectedChat === '###LOBY###') {
      msgs = msgs.filter((m) => m.lobby);
    } else {
      msgs = msgs.filter((m) => {
        return (m.from === selectedChat && m.with === this.state.user.username) ||
          (m.from === this.state.user.username && m.with === selectedChat)
      });
    }
    return msgs;
  }

  sendAll = (msg) => {
    this.state.chats.forEach((chat) => {
      if (chat.title !== '###LOBY###') {
        const conn = this.peer.connect(chat.title);
        conn.on('open', () => {
          conn.send(msg);
        });
      }
    })
  }

  sendInput = () => {
    const msgText = this.refs.input.state.value;
    const msg = {
      position: 'left',
      type: 'text',
      text: Steg.encode(msgText, this.stegImage),
      date: new Date(),
      lobby: false,
      from: this.state.user.username,
      with: this.state.selectedChat
    }

    // send to all people
    if (this.state.selectedChat === '###LOBY###') {
      msg.lobby = true;
      msg.text = Steg.encode(`From ${msg.from}: ${msg.text}`, this.stegImage);
      this.sendAll(msg);
    } else {
      const conn = this.peer.connect(this.state.selectedChat);
      conn.on('open', () => {
        conn.send(msg);
      });
    }

    const msgsList = [...this.state.messages];
    const newMsg = Object.assign({}, msg);
    newMsg.text = msgText;
    newMsg.position = 'right';
    msgsList.push(newMsg);
    this.refs.input.clear();
    this.setState({
      messages: msgsList
    });


  }

  handleRecMessage = (data) => {
    console.log(data);
    const msgs = [...this.state.messages];
    const im = new Image();
    im.src = data.text;
    im.onload = () => {
      data.text = Steg.decode(im);
      msgs.push(data);
      this.setState({
        messages: msgs
      });
      console.log(msgs);
    }
  }

  render() {
    const { isLoggedIn } = this.state;
    const msgs = this.getMessages();
    if (!isLoggedIn) {
      return (
        <div style={{ textAlign: "center" }}>
          <LoginPage handleSignup={this.handleSignup} handleLogin={this.handleLogin} />
        </div>
      )
    } else {
      return (

        <Container fluid style={{ padding: 0 }}>
          <Row>
            <Col md={12}>
              <Navbar
                left={
                  <div>
                    Active Users
                    <Button
                      color='white'
                      backgroundColor='black'
                      onClick={this.refreshActiveUsers}
                      text='Refresh' />
                  </div>
                }
                center={
                  <div>{this.state.selectedChat}</div>
                } />
            </Col>

          </Row>
          <Row>
            <Col md={3} style={{ height: window.innerHeight - 100 }}>
              <ChatList
                className='chat-list'
                onClick={this.personSelected}
                toBottomHeight={'100%'}
                dataSource={this.state.chats} />
            </Col>
            <Col md={9}>
              <MessageList
                className='message-list'
                lockable={true}
                toBottomHeight={'100%'}
                dataSource={msgs} />
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Input
                ref='input'
                className='chat-inp'
                placeholder="Type here..."
                multiline={false}
                rightButtons={
                  <Button
                    color='white'
                    backgroundColor='black'
                    onClick={this.sendInput}
                    text='Send' />
                } />
            </Col>
          </Row>
        </Container>
      );
    }
  }
}
