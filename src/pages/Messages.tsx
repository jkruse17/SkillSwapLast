import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, Plus, ArrowLeft, Trash2 } from 'lucide-react';

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  last_message?: {
    content: string;
    created_at: string;
  };
  other_user?: {
    name: string;
    avatar_url: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    name: string;
    avatar_url: string;
  };
}

export function Messages() {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      loadChatRooms();
      const roomSubscription = subscribeToRooms();
      return () => {
        roomSubscription?.unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
      const messageSubscription = subscribeToMessages(selectedRoom.id);
      return () => {
        messageSubscription?.unsubscribe();
      };
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const subscribeToRooms = () => {
    return supabase
      .channel('chat_rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        () => {
          loadChatRooms();
        }
      )
      .subscribe();
  };

  const subscribeToMessages = (roomId: string) => {
    return supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.sender_id !== user?.id) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', payload.new.sender_id)
              .single();

            const newMessage = {
              ...payload.new,
              sender
            };

            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();
  };

  const loadChatRooms = async () => {
    try {
      const { data: participations, error: participationsError } = await supabase
        .from('chat_participants')
        .select('chat_room_id')
        .eq('user_id', user?.id);

      if (participationsError) throw participationsError;

      const roomIds = participations?.map(p => p.chat_room_id) || [];

      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants (
            user_id,
            profiles (
              name,
              avatar_url
            )
          ),
          messages (
            content,
            created_at
          )
        `)
        .in('id', roomIds)
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;

      const formattedRooms = rooms?.map(room => {
        const otherParticipant = room.chat_participants.find(
          (p: any) => p.user_id !== user?.id
        );
        const lastMessage = room.messages
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        return {
          id: room.id,
          name: room.name || otherParticipant?.profiles?.name || 'Chat',
          type: room.type,
          last_message: lastMessage,
          other_user: otherParticipant?.profiles
        };
      });

      setChatRooms(formattedRooms || []);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (
            name,
            avatar_url
          )
        `)
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data?.map(message => ({
        ...message,
        sender: message.profiles
      }));

      setMessages(formattedMessages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      setDeleting(messageId);
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !newMessage.trim() || !user || sending) return;

    try {
      setSending(true);
      const messageContent = newMessage.trim();
      setNewMessage('');

      // Get the current user's profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      // Create optimistic message
      const optimisticMessage: Message = {
        id: crypto.randomUUID(), // Temporary ID
        content: messageContent,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        sender: {
          name: profile?.name || user.email?.split('@')[0] || 'User',
          avatar_url: profile?.avatar_url || null
        }
      };

      // Update UI immediately
      setMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();

      // Send message to server
      const { error, data } = await supabase
        .from('messages')
        .insert({
          chat_room_id: selectedRoom.id,
          sender_id: user.id,
          content: messageContent
        })
        .select()
        .single();

      if (error) throw error;

      // Update the temporary message with the real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? { ...data, sender: optimisticMessage.sender } : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== crypto.randomUUID()));
      setNewMessage(messageContent); // Restore the message content
    } finally {
      setSending(false);
    }
  };

  const searchUsers = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .ilike('name', `%${term}%`)
        .neq('id', user?.id)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const startChat = async (otherUser: any) => {
    try {
      const existingChatRoom = chatRooms.find(room =>
        room.other_user?.name === otherUser.name
      );

      if (existingChatRoom) {
        setSelectedRoom(existingChatRoom);
        setShowNewChat(false);
        return;
      }

      // Create new chat room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          type: 'direct',
          name: `${user?.email} & ${otherUser.name}`
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_room_id: room.id, user_id: user?.id },
          { chat_room_id: room.id, user_id: otherUser.id }
        ]);

      if (participantsError) throw participantsError;

      await loadChatRooms();
      setSelectedRoom(room);
      setShowNewChat(false);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-12 h-full">
          {/* Chat List */}
          <div className={`col-span-12 md:col-span-4 border-r ${selectedRoom ? 'hidden md:block' : ''}`}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold mb-4">Messages</h2>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Message
                </button>
              </div>

              {showNewChat ? (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setShowNewChat(false)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-medium">New Message</h3>
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-4 space-y-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => startChat(result)}
                        className="w-full p-2 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                      >
                        <img
                          src={result.avatar_url || `https://ui-avatars.com/api/?name=${result.name}`}
                          alt={result.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="font-medium">{result.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="flex items-center gap-4 animate-pulse">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : chatRooms.length > 0 ? (
                    chatRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`w-full p-4 hover:bg-gray-50 flex items-start gap-4 border-b ${
                          selectedRoom?.id === room.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <img
                          src={room.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${room.name}`}
                          alt={room.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-gray-900">{room.name}</h3>
                          {room.last_message && (
                            <p className="text-sm text-gray-500 truncate">
                              {room.last_message.content}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No messages yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className={`col-span-12 md:col-span-8 ${!selectedRoom ? 'hidden md:block' : ''}`}>
            {selectedRoom ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b flex items-center gap-4">
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="md:hidden text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedRoom.other_user?.avatar_url || `https://ui-avatars.com/api/?name=${selectedRoom.name}`}
                      alt={selectedRoom.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <h2 className="text-lg font-semibold">{selectedRoom.name}</h2>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-4 group ${
                        message.sender_id === user?.id ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <img
                        src={message.sender.avatar_url || `https://ui-avatars.com/api/?name=${message.sender.name}`}
                        alt={message.sender.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div
                        className={`max-w-[70%] rounded-lg p-3 relative ${
                          message.sender_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                        {message.sender_id === user?.id && (
                          <button
                            onClick={() => deleteMessage(message.id)}
                            disabled={deleting === message.id}
                            className={`absolute -right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 ${
                              deleting === message.id ? 'cursor-not-allowed' : ''
                            }`}
                          >
                            <Trash2 className={`w-4 h-4 ${deleting === message.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className={`w-5 h-5 ${sending ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a chat or start a new conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose from your existing chats or click "New Message" to start a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}