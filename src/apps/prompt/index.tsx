import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

const conversation = await PromptWindow.getPromptInfo();

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App initialData={conversation} />
  </StrictMode>,
);
