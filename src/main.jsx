import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from "@vercel/analytics/react"
import './index.css'
import App from './App.jsx'
import EmbedView from './components/EmbedView.jsx'

const isEmbed = window.location.pathname.startsWith('/embed/');
const embedSurveyId = isEmbed ? window.location.pathname.split('/')[2] : null;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isEmbed ? <EmbedView surveyId={embedSurveyId} /> : <App />}
    <Analytics />
  </StrictMode>,
)
