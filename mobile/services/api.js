import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Your backend URL

// Register push token with backend
export async function registerToken(token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/register-token`, {
      token: token,
      userId: 'user-id' // Replace with actual user ID
    });
    console.log('✅ Token registered with backend');
    return response.data;
  } catch (error) {
    console.error('❌ Error registering token:', error);
  }
}