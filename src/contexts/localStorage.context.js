import React, { createContext, Component } from 'react';

import uuid from 'uuid/v4';

// HELPERS
import { validateRegister, validateLogin } from '../helpers/validations';

export const LocalStorageContext = createContext();

export class LocalStorageProvider extends Component {
  // admin info that is stored in localStorage on componentDidMount()
  static defaultProps = {
    admin: {
      email: 'admin@admin.com',
      password: 'admin'
    }
  };
  constructor() {
    super();
    this.state = {
      users: JSON.parse(localStorage.getItem('users')) || {}, // used to update localStorage
      currentUser: JSON.parse(localStorage.getItem('currentUser')) || null, // logged in user
      shouldRedirect: false, // used to give components info about redirecting
      register: {
        // onChange register inputs
        username: '',
        email: '',
        password: '',
        repeatPassword: ''
      },
      login: {
        // onChange login inputs
        email: '',
        password: ''
      }
    };

    this.handleRegisterChange = this.handleRegisterChange.bind(this);
    this.submitRegister = this.submitRegister.bind(this);
    this.handleLoginChange = this.handleLoginChange.bind(this);
    this.submitLogin = this.submitLogin.bind(this);

    this.logout = this.logout.bind(this);
    this.removeUser = this.removeUser.bind(this);
  }

  // setting admin account in localStorage
  componentDidMount() {
    localStorage.setItem('admin', JSON.stringify(this.props.admin));
  }

  // za handleChange funkciju ispod

  // razmisljao sam o ovome ali mislim da se cak i ne isplati zato sto treba argument da se ubaci sto znaci da na svaki function call sto je 4 puta u register.js i 2 u login.js
  // treba da se pravi nova funckija a posto radi na handleChange znaci da ce dok user kuca na svako slovo da pravi po 4 funckije u register.js ili po 2 u login.js
  // drugi nacin bi bio da napravim metodu koja ce da pozove ovu funkciju, sto znaci da se prave 2 posebne metode koje zovu tu funkciju umesto 2 funkcije to bi trebalo da je brze
  // ali za sad mi te componente nemaju constructor tako da za svaku metodu bi trebao da pravim constructor da bi bindovo i ako sve uzmem u obzir mislim da je ovako brze mada opet  // ne znam koliko vremena react oduzme da napravi constructor pa cisto posle kad upgradujemo aplikaciju neka ga tu mozda nam zatreba

  // realno ne znam ni dal bi funkcija radila nisam probao ali moze da se napravi

  // handleChange(item) {
  //   return function handleItemChange(event) {
  //     const currentState = this.state[item];
  //     currentState[event.target.name] = event.target.value;
  //     this.setState({ [item]: currentState });
  //   };
  // }

  handleRegisterChange(event) {
    const currentState = this.state.register;
    currentState[event.target.name] = event.target.value;
    this.setState({ register: currentState });
  }

  registrationSuccess(previousState) {
    // pokusavao sam na bolji nacin sa prevState ali nije radilo kako treba
    const currentState = this.state.users;
    const newState = {
      username: previousState.username,
      email: previousState.email,
      password: previousState.password
    };
    // stvarno ne znam kako drugacije da resetujem ceo state objekat a da ima key-eve kao pre
    const clearRegister = {
      username: '',
      email: '',
      password: '',
      repeatPassword: ''
    };
    currentState[uuid()] = newState;
    // updates state.users => updates localStorage | cleans inputs and sets shouldRedirect to true so Register component knows if it should redirect
    this.setState(
      { users: currentState, register: clearRegister, shouldRedirect: true },
      () => {
        localStorage.setItem('users', JSON.stringify(this.state.users));
        setTimeout(() => {
          this.setState({ shouldRedirect: false });
        }, 100);
      }
    );
  }

  registrationFailure() {
    alert(validateRegister(this.state.register, this.state.users)); // alerts returned strings from helpers/validation.js > validateRegister()
  }

  submitRegister(event) {
    event.preventDefault();
    validateRegister(this.state.register, this.state.users) === true
      ? this.registrationSuccess(this.state.register)
      : this.registrationFailure();
  }

  // LOGIN

  handleLoginChange(event) {
    const currentState = this.state.login;
    currentState[event.target.name] = event.target.value;
    this.setState({ login: currentState });
  }

  loginSuccess() {
    // getting the user object from localStorage that is about to get logged in
    const { user, id } = validateLogin(this.state.login, this.state.users);
    // setting currentUser in state (logged in user) and setting shouldRedirect to true for 100ms (this redirect is happening in Login.js (LoginRoute folder))
    this.setState({ currentUser: { [id]: user }, shouldRedirect: true }, () => {
      // saving currentUser (logged in user) in localStorage
      localStorage.setItem(
        'currentUser',
        JSON.stringify(this.state.currentUser)
      );
      setTimeout(() => {
        this.setState({ shouldRedirect: false });
      }, 100);
    });
  }

  loginFailure() {
    alert(validateLogin(this.state.login, this.state.users)); // alerts returned strings from helpers/validation.js > validateLogin()
  }

  submitLogin(event) {
    event.preventDefault();
    // extracting the success boolean from validateLogin function in helpers/validations.js
    const { success } = validateLogin(this.state.login, this.state.users);
    success === true ? this.loginSuccess() : this.loginFailure();
  }

  logout() {
    this.setState({ currentUser: null });
    localStorage.removeItem('currentUser');
  }

  removeUser(email) {
    const currentState = this.state.users;
    let matchingIndex;
    Object.values(currentState).map(
      (user, index) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        (matchingIndex = index)
    );
    const matchingID = Object.keys(currentState)[matchingIndex];
    delete currentState[matchingID];

    this.setState({ users: currentState });
    localStorage.setItem('users', JSON.stringify(this.state.users));
  }

  render() {
    const {
      handleRegisterChange,
      submitRegister,
      handleLoginChange,
      submitLogin,
      logout,
      removeUser
    } = this;
    const { register, login, shouldRedirect, currentUser, users } = this.state;
    return (
      <LocalStorageContext.Provider
        value={{
          handleRegisterChange,
          submitRegister,
          register,
          shouldRedirect,
          login,
          handleLoginChange,
          submitLogin,
          currentUser,
          logout,
          removeUser,
          users
        }}
      >
        {this.props.children}
      </LocalStorageContext.Provider>
    );
  }
}
