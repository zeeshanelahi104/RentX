import 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

if (Platform.OS === 'web') {
  // RN's flex:1 chain needs a real pixel height to cascade from; the browser's
  // html/body have none by default, which clips ScrollView content instead of scrolling it.
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root { height: 100%; }
    body { overflow: hidden; }
  `;
  document.head.appendChild(style);
}

registerRootComponent(App);
