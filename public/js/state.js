const _state = {
  profile: null,
  jobs: [],
  skills: [],
  skillCategories: [],
  certifications: [],
  awards: [],
  settings: {},
  currentResumeConfig: {
    name: 'My Resume',
    jobIds: [],
    respIds: [],
    skillIds: [],
    certIds: [],
    awardIds: []
  }
};

const _listeners = {};

export function getState(key) {
  return _state[key];
}

export function setState(key, value) {
  _state[key] = value;
  (_listeners[key] || []).forEach(fn => fn(value));
}

export function onStateChange(key, fn) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(fn);
  // Return unsubscribe function
  return () => {
    _listeners[key] = _listeners[key].filter(f => f !== fn);
  };
}
