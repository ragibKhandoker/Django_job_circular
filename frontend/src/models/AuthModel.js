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
