const handleResponse = (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const getEngineStatus = () => {
  return fetch('/engine/status')
    .then(handleResponse)
    .then((data) => data.status);
};

const pauseEngine = () => {
  return fetch('/engine/pause', { method: 'PATCH' })
    .then(handleResponse);
};

const stopEngine = () => {
  return fetch('/engine/stop', { method: 'PATCH' })
    .then(handleResponse);
};

const continueEngine = () => {
  return fetch('/engine/continue', { method: 'PATCH' })
    .then(handleResponse);
};

const startEngine = () => {
  return fetch('/engine/start', { method: 'PATCH' })
    .then(handleResponse);
};

const restartEngine = () => {
  return fetch('/engine/restart', { method: 'PATCH' })
    .then(handleResponse);
};

export { getEngineStatus, pauseEngine, stopEngine, continueEngine, startEngine, restartEngine };
