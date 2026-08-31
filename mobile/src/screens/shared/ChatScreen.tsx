import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getMessages, sendMessage } from '../../services/chatService';
import { useAuthStore } from '../../store/authStore';
import { io } from 'socket.io-client';
import { BASE_URL } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages();
    setupSocket();
    return () => socketRef.current?.disconnect();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await getMessages(bookingId);
      setMessages(res.data.messages);
    } catch (e) {}
  };

  const setupSocket = async () => {
    const token = await AsyncStorage.getItem('rentx_token');
    const socket = io(BASE_URL.replace('/api', ''), { auth: { token } });
    socketRef.current = socket;
    socket.emit('join_booking', bookingId);
    socket.on('new_message', ({ message }: any) => {
      setMessages(prev => [...prev, message]);
    });
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const msgText = text.trim();
    setText('');
    try {
      await sendMessage(bookingId, msgText);
    } catch (e) {}
  };

  const renderMsg = ({ item }: any) => {
    const isMe = item.senderId?._id === user?._id || item.senderId === user?._id;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.bubble, isMe && styles.bubbleMe]}>
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
            {new Date(item.createdAt).toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>گفتگو</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMsg}
        keyExtractor={item => item._id || item.createdAt}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="پیغام لکھیں..."
          placeholderTextColor={COLORS.muted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Icon name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  list: { padding: 16, gap: 8 },
  msgRow: { alignItems: 'flex-start', marginBottom: 8 },
  msgRowMe: { alignItems: 'flex-end' },
  bubble: { backgroundColor: '#fff', borderRadius: 16, borderBottomLeftRadius: 4, padding: 12, maxWidth: '78%', elevation: 1 },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  msgText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 11, color: COLORS.muted, marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#fff', gap: 10, alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: COLORS.text, maxHeight: 100 },
  sendBtn: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
