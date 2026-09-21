import { act } from 'react';

// Lets pending promises and timers settle inside an act() boundary.
const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

// Runs flushAsync several times in a row, for controllers that chain polls.
const flushMany = async (times = 5) => {
  for (let i = 0; i < times; i += 1) {
    await flushAsync();
  }
};

export { flushAsync, flushMany };
