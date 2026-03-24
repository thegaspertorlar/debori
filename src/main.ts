import './style.css'
import { createAppShell } from './appShell'

const app = document.getElementById('app')!
app.innerHTML = ''
createAppShell(app)

console.log('App initialized')
