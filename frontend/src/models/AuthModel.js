import { httpClient } from './httpClient.js';

export const EMPTY_SIGNUP = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  password1: '',
  password2: '',
};

export const AuthModel = {
  /** Also sets the csrftoken cookie needed for later POSTs. */
  currentUser() {
    return httpClient.get('/auth/me/');
  },

  /** A new tab's own copy of the session it started with. Returns { user, session_key }. */
  forkSession() {
    return httpClient.post('/auth/session/fork/');
  },

  login(username, password, role) {
    return httpClient.post('/auth/login/', { username, password, role });
  },

  logout() {
    return httpClient.post('/auth/logout/');
  },

  signup(values) {
    return httpClient.post('/auth/signup/', values);
  },

  requestPasswordReset(email) {
    return httpClient.post('/auth/password-reset/', { email });
  },
};
