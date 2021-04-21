import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

import App from './App';


ReactDOM.render(<Router><App /></Router>, document.querySelector('#root'));

serviceWorkerRegistration.register();
