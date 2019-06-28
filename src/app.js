import express from 'express';

import './database';

class App {
  constructor() {
    this.server = express();
  }
}

export default new App().server;
