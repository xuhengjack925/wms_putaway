import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { sampleDefects } from './data/defects'
import { logDefect, clearDefects, STORAGE_KEY } from './utils/defectLogger'

// Load sample defects if none exist
if (!localStorage.getItem(STORAGE_KEY)) {
  sampleDefects.forEach(defect => logDefect(defect));
  console.log('Loaded sample defects into localStorage');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
