import React from 'react';
import { Route, Switch, Link, Redirect } from 'react-router-dom'
import axios from 'axios';
import "./App.css";
import ToggleButton from 'react-toggle-button'
// import getLocation from '../helpers/index';

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';

import Profile from './components/Profile';
import HotSpots from './components/HotSpots';
import Pending from './components/Pending';
import Matches from './components/Matches';
import Signup from './components/Signup';
import Login from './components/Login';
import Interests from './components/Interests';
import Datezone from './components/Datezone';
import Friendzone from './components/Friendzone';
import Messages from './components/Messages';


class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      user: {},
      isLoggedIn: false,
      failedLogin: false,
      interests: [null, null, null],
      customers: [],
      datingPool: [],
      interested: [],
      toggleValue: false,
      customer: null,
      poolOption: null,
    }
    
    this.showAuthFail = this.showAuthFail.bind(this);
    this.setInterests = this.setInterests.bind(this); 
    this.getUserInfo = this.getUserInfo.bind(this);
    this.gateKeeper = this.gateKeeper.bind(this);
    this.openGate = this.openGate.bind(this);
    this.logout = this.logout.bind(this);
    this.getCustomers = this.getCustomers.bind(this);
    this.acceptMatch = this.acceptMatch.bind(this);
    this.rejectMatch = this.rejectMatch.bind(this);
    this.skipMatch = this.skipMatch.bind(this);
    // attempt to get user data initially.
    // if no cookie, middleware redirects.
    
    this.gateKeeper();
    
  }

  // function to flip bool and get user info when signup succeeds
  gateKeeper() {
    
    return this.getUserInfo()
    .then(response => {
      // console.log('test', response);
      if (typeof response.data === 'object'){
        this.openGate(response);
        console.log(response);
        const successCallback = async (position) => {
          // By using the 'maximumAge' option above, the position
          // object is guaranteed to be at most 10 minutes old.
          // could send timestamp too!
          try {
            const { longitude, latitude } = position.coords;
            console.log(longitude, latitude);

            const data = await axios.patch('/users', { longitude, latitude })
            this.setUser(data);
            this.getCustomers();
          } catch(err) {
            console.warn(err);
          }         
        }
        
        
        const errorCallback = async () => {
          // Update a div element with error.message.
          return await this.showAuthFail();
        }

        return navigator.geolocation.getCurrentPosition(successCallback, errorCallback, { maximumAge: 600000 })
      }
    })
    .catch(err => { 
      console.warn(err);
      this.showAuthFail();
    });
  }
  
  getCustomers(){
    axios.get('/customers')
    .then((response) => {
      let everyoneElse = response.data.filter((person)=>{
        return person.id !== this.state.user.id;
      })
      var pool = [];
      everyoneElse.forEach((person)=> {
       
        
       if(this.state.user.preference === person.gender && this.state.user.gender === person.preference){
         if (this.state.interests.indexOf(person.int1) !== -1 || this.state.interests.indexOf(person.int2) !== -1 || this.state.interests.indexOf(person.int3) !== -1){
          pool.push((person));
        }
      }
    })
    
    console.log('pool', pool);

      this.setState({
        customers: everyoneElse,
        customer: everyoneElse[0],
        datingPool: pool,
        poolOption: pool[0],
      })
      console.log('state dating pool', this.state.datingPool);
      console.log('state poolOption', this.state.poolOption);
    })
  }


  logout() {
 
    axios.get('/logout');
    this.setState({
      isLoggedIn: false,
    })
  }
  
  setInterests(array) {
    this.setState({
      interests: array,
    })
  }
  
  acceptMatch(){
    console.log("accept");
    let profile = this.state.datingPool.shift();
    let datingPoolNow = this.state.datingPool;
    this.state.interested.push(profile);
    let interestedNow = this.state.interested;
    this.setState({
      // customers: customersNow,
      interested: interestedNow,
      // customer: customersNow[0],
      datingPool: datingPoolNow,
      poolOption: datingPoolNow[0],
    });
    axios.post('/couples', {user1Id: this.state.user.id, user2Id: profile.id})
    .then((result) => {
      console.log('couples post result:', result);
    })
    .catch((err) => {
      console.log('couples post error:', err);
    })
  }

  rejectMatch(){
    console.log("reject");
    let profile = this.state.datingPool.shift();
    let datingPoolNow = this.state.datingPool;
    this.setState({
      datingPool: datingPoolNow,
      poolOption: datingPoolNow[0],
    });
    // save to database that they were rejected.
  }

  skipMatch(){
    console.log("skip");
    let profile = this.state.datingPool.shift();
    
    this.state.datingPool.push(profile);
    let datingPoolNow = this.state.datingPool;
    
    this.setState({
      datingPool: datingPoolNow,
      poolOption: datingPoolNow[0],
    })
  }

  getUserInfo() {
    // no auto login happening. send get to login instead?
    return axios.get('/users');
  }


  showAuthFail() {
    this.setState({
      failedLogin: true,
    })
  }

  openGate(response) {
    this.setState({
      isLoggedIn: !this.state.isLoggedIn,
      user: response.data,
    })

  }

  setUser(user) {
    let myInterests = [];
    myInterests.push(user.data.int1);
    myInterests.push(user.data.int2);
    myInterests.push(user.data.int3);
    this.setState({
      user: user.data,
      interests: myInterests,
    })
  }
  
  
  render() {
    const {customer, isLoggedIn, failedLogin, user, customers, toggleValue, interested, interests, datingPool, poolOption } = this.state;

          let navStyle = "";
          let appStyle = "";
          if(!toggleValue){
            navStyle = "date-navigation";
            appStyle = "App-date";
          } else{
            navStyle = "friend-navigation";
            appStyle = "App-friend";
          }
    return (
      <div className={appStyle} >
        <Navbar className={navStyle} collapseOnSelect expand="lg" variant="dark">
          <Navbar.Brand href="/" className="title">3rd-Wheel</Navbar.Brand>
          <div className="toggle-div row col-4">
          <p className="zone-title zone-title-date col-3">Datezone</p>
          <ToggleButton className="zone-toggle col-3" id="zone-toggler"
            inactiveLabel={<p className="toggle-emoji">&#128525;</p>}
              activeLabel={<p className="toggle-emoji">&#128515;</p>}
            value={this.state.toggleValue}
            onToggle={(value) => {
              this.setState({
                toggleValue: !value,
              })
            }} />
          <p className="zone-title col-3">Friendzone</p>
          </div>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
          
        { 
          isLoggedIn ? 
          // logged in nav
          <Nav className="top-bar">
            <NavDropdown title="Your Card" id="basic-nav-dropdown">
              <Link className="dropdown-item" to="/profile" >Profile</Link>
              <Link className="dropdown-item" to="/interests" >Interests</Link>
            </NavDropdown>
            <Link className="nav-link" to="/hotspots" >Hot Spots</Link>
            <Link className="nav-link" to="/matches" >Find Matches</Link>
            <Link className="nav-link" to="/pending" >Mutual Interests</Link>
            <Link className="nav-link" to="/messages">Messages</Link>
            <Link className="nav-link" to="/signin"onClick={this.logout} >Logout</Link>
            {/*  // Make this sign out user and relocate them to sign in
              <Link className="nav-link" to="/signin" >Sign out</Link> */}
          </Nav>
          : 
          // not logged in nav
          <Nav className="top-bar">
            <Link className="nav-link" to="/signup" >Sign up</Link>
            <Link className="nav-link" to="/login" >Log in</Link>
          </Nav>
        }
          </Navbar.Collapse>
  
        </Navbar>
        { 
          isLoggedIn ? 
          // !loggedIn routes
            <Switch>
              <Route exact path="/" components={() => {
                <Redirect to="/profile" />
              }} />
              <Route path="/matches" render={(props) => <Matches {...props} user={user} customers={customers} customer={customer} datingPool={datingPool} poolOption={poolOption} rejectMatch={this.rejectMatch} skipMatch={this.skipMatch} acceptMatch={this.acceptMatch} />}  />
              <Route path="/interests" render={(props) => <Interests {...props} user={user}  setInterests={this.setInterests} />} />
              <Route path="/hotspots" render={(props) => <HotSpots {...props} user={user} />} />
              <Route path="/pending" render={(props) => toggleValue ? <Friendzone {...props} user={user} customers={customers} interests={interests} /> : <Datezone {...props} user={user} interested={interested} interests={interests}/> }/>
              <Route path="/messages" render={(props) => <Messages {...props} />} />
              <Route path="/profile" render={(props) => <Profile {...props} user={user} failedLogin={failedLogin} />} />
            </Switch>
          :
          // !loggedIn routes
            <Switch>
              <Route exact path="/" render={() => (
                <Redirect to="/signup"/>
              )} />
              <Route path="/signup" render={(props) => <Signup {...props} toggleValue={toggleValue} showAuthFail={this.showAuthFail} gateKeeper={this.gateKeeper} isLoggedIn={isLoggedIn} />} />
              <Route path="/login" render={(props) => <Login {...props} toggleValue={toggleValue} showAuthFail={this.showAuthFail} gateKeeper={this.gateKeeper} isLoggedIn={isLoggedIn} />} />
            </Switch>
        }
      </div>
    )
  }
}

export default App;