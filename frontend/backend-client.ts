import { Client } from './client';
import { BACKEND_URL } from './config';

const client = new Client(BACKEND_URL || '', { 
  requestInit: { credentials: "include" } 
});

export default client;
