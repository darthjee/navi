import { act } from 'react';

// Lets pending promises and timers settle inside an act() boundary.
const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

export { flushAsync };
