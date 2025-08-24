import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { 
  Loader2, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  History,
  MessageSquare,
  Sparkles,
  Clock,
  Plus,
  ChevronLeft
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, getDocs, serverTimestamp, where, limit, updateDoc } from 'firebase/firestore';
import { functions, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId: string;
  actionItems?: any[];
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: Date;
  lastActivity: Date;
}

export const AIChatPage: React.FC = () => {
  const { user } = useAuth();
  const { expenses, budgets, customPeople, publicPeople } = useFirestoreData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history from Firestore
  useEffect(() => {
    if (!user) {
      setLoadingHistory(false);
      return;
    }

    // Timeout fallback to ensure loading doesn't hang forever
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loadingHistory to false');
      setLoadingHistory(false);
    }, 10000); // 10 second timeout

    // Load chat sessions with real-time updates
    const sessionsRef = collection(db, `users/${user.uid}/chatSessions`);
    const q = query(sessionsRef, orderBy('lastActivity', 'desc'), limit(10));
    
    const unsubscribeSessions = onSnapshot(q, async (snapshot) => {
      try {
        console.log('Sessions updated, loading new data...');
        const loadedSessions: ChatSession[] = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          loadedSessions.push({
            id: doc.id,
            title: data.title || 'New Chat',
            lastMessage: data.lastMessage || '',
            messageCount: data.messageCount || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastActivity: data.lastActivity?.toDate() || new Date(),
          });
        });

        console.log('Real-time sessions update:', loadedSessions.length);
        setSessions(loadedSessions);

        // Set current session (most recent or create new)
        if (loadedSessions.length > 0 && !currentSessionId) {
          console.log('Setting current session to:', loadedSessions[0].id);
          setCurrentSessionId(loadedSessions[0].id);
        } else if (loadedSessions.length === 0 && !currentSessionId) {
          // Create new session
          console.log('Creating new session');
          const newSessionId = await createNewSession();
          console.log('Created new session:', newSessionId);
          if (newSessionId) {
            setCurrentSessionId(newSessionId);
          } else {
            // If session creation fails, just proceed without sessions
            console.log('Session creation failed, proceeding without sessions');
            setLoadingHistory(false);
          }
        }
        
        clearTimeout(loadingTimeout);
        setLoadingHistory(false);
      } catch (error) {
        console.error('Error in sessions listener:', error);
        clearTimeout(loadingTimeout);
        setLoadingHistory(false);
      }
    }, (error) => {
      console.error('Sessions listener error:', error);
      clearTimeout(loadingTimeout);
      setLoadingHistory(false);
    });

    return () => {
      unsubscribeSessions();
      clearTimeout(loadingTimeout);
    };
  }, [user]);

  // Load messages for current session
  useEffect(() => {
    if (!user || !currentSessionId) {
      // If no user or session, stop loading
      if (!user) setLoadingHistory(false);
      return;
    }

    console.log('Loading messages for session:', currentSessionId);

    const conversationRef = collection(db, `users/${user.uid}/conversations`);
    // Use only the where clause to avoid index requirements, then sort in memory
    const q = query(
      conversationRef, 
      where('sessionId', '==', currentSessionId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Messages snapshot received, docs:', snapshot.docs.length);
      const loadedMessages: ChatMessage[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          sessionId: data.sessionId || currentSessionId,
          actionItems: data.actionItems,
          isError: data.isError
        });
      });

      // Sort messages by timestamp in memory (since we removed orderBy to avoid index requirements)
      loadedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (loadedMessages.length === 0) {
        // Add welcome message if no history
        loadedMessages.push({
          id: 'welcome',
          role: 'assistant',
          sessionId: currentSessionId,
          content: `## Welcome to KautilyaAI Co-Pilot! 🤖

I'm **KautilyaAI**, your intelligent financial advisor for Budget Buddy. Named after the ancient Indian philosopher and economist Chanakya (Kautilya), I bring wisdom to your wealth management.

I can help you:

- **Analyze your spending patterns** 📊
- **Track and categorize expenses** 💰
- **Manage shared expenses with people** 👥
- **Create and manage budgets** 📈
- **Get personalized financial advice** 💡
- **Answer questions about your finances** ❓
- **Understand the People module and relationships** 🏠

Try asking me something like:
- *"Show me my spending this month"*
- *"How am I doing with my budget?"*
- *"Who do I spend the most money with?"*
- *"Help me understand the People module"*
- *"Show me shared expenses with family"*
- *"How do I add new people to track expenses?"*

Let's start managing your finances with ancient wisdom and modern AI! 🚀`,
          timestamp: new Date(),
        });
      }

      setMessages(loadedMessages);
      setLoadingHistory(false);
      console.log('Messages loaded successfully, loadingHistory set to false');
    }, (error) => {
      console.error('Error loading messages:', error);
      setLoadingHistory(false);
      toast.error('Failed to load chat history');
    });

    return () => unsubscribe();
  }, [user, currentSessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewSession = async (): Promise<string> => {
    if (!user) return '';

    try {
      const sessionsRef = collection(db, `users/${user.uid}/chatSessions`);
      const newSession = await addDoc(sessionsRef, {
        title: 'New Chat',
        lastMessage: '',
        messageCount: 0,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
      });

      return newSession.id;
    } catch (error) {
      console.error('Error creating new session:', error);
      return '';
    }
  };

  const updateSessionActivity = async (sessionId: string, lastMessage: string) => {
    if (!user || !sessionId) return;

    try {
      const sessionRef = doc(db, `users/${user.uid}/chatSessions`, sessionId);
      await updateDoc(sessionRef, {
        lastMessage: lastMessage.substring(0, 100) + (lastMessage.length > 100 ? '...' : ''),
        lastActivity: serverTimestamp(),
        messageCount: messages.filter(m => m.id !== 'welcome').length + 1,
      });
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const switchToSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessions(false);
  };

  const createNewChatSession = async () => {
    const newSessionId = await createNewSession();
    if (newSessionId) {
      setCurrentSessionId(newSessionId);
      setShowSessions(false);
      toast.success('New chat session created');
    }
  };

  // Save message to Firestore
  const saveMessageToHistory = async (message: ChatMessage) => {
    if (!user || message.id === 'welcome') return;

    try {
      await addDoc(collection(db, `users/${user.uid}/conversations`), {
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        sessionId: message.sessionId,
        actionItems: message.actionItems || [],
        isError: message.isError || false
      });
      
      // Update session activity
      if (message.sessionId) {
        await updateSessionActivity(message.sessionId, message.content);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
      sessionId: currentSessionId,
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // Save user message
    await saveMessageToHistory(userMessage);

    try {
      const chatFunction = httpsCallable(functions, 'chatWithGemini');
      const result = await chatFunction({
        userId: user.uid,
        message: message.trim(),
        context: {
          recentExpenses: expenses.slice(0, 20),
          activeBudgets: budgets.filter(b => (b as any).isActive !== false),
          customPeople: customPeople.slice(0, 50), // Limit for performance
          publicPeople: publicPeople.slice(0, 20)   // Limit for performance
        }
      });

      const data = result.data as any;
      
      if (data.response) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          sessionId: currentSessionId,
          actionItems: data.context
        };

        setMessages(prev => [...prev, aiMessage]);
        await saveMessageToHistory(aiMessage);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '**Sorry, I encountered an error.** 😔\n\nPlease try again in a moment. If the problem persists, make sure your internet connection is stable.',
        timestamp: new Date(),
        sessionId: currentSessionId,
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      await saveMessageToHistory(errorMessage);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(currentMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const deleteCurrentSession = async () => {
    if (!user || !currentSessionId) return;

    try {
      // Clear current session messages
      const conversationRef = collection(db, `users/${user.uid}/conversations`);
      const q = query(conversationRef, where('sessionId', '==', currentSessionId));
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      
      // Delete the session itself
      await deleteDoc(doc(db, `users/${user.uid}/chatSessions`, currentSessionId));
      
      // Create a new session
      const newSessionId = await createNewSession();
      setCurrentSessionId(newSessionId);
      
      toast.success('Chat session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const renameSession = async (sessionId: string, newTitle: string) => {
    if (!user || !newTitle.trim()) return;

    try {
      const sessionRef = doc(db, `users/${user.uid}/chatSessions`, sessionId);
      await updateDoc(sessionRef, {
        title: newTitle.trim(),
        lastActivity: new Date()
      });
      
      // Update local sessions state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle.trim() }
          : session
      ));
      
      toast.success('Session renamed');
    } catch (error) {
      console.error('Error renaming session:', error);
      toast.error('Failed to rename session');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;

    try {
      // Delete all messages in the session
      const conversationRef = collection(db, `users/${user.uid}/conversations`);
      const q = query(conversationRef, where('sessionId', '==', sessionId));
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      
      // Delete the session itself
      await deleteDoc(doc(db, `users/${user.uid}/chatSessions`, sessionId));
      
      // If this was the current session, create a new one
      if (sessionId === currentSessionId) {
        const newSessionId = await createNewSession();
        setCurrentSessionId(newSessionId);
      }
      
      toast.success('Session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  // Quick action suggestions
  const quickActions = [
    "Show my spending this month",
    "How am I doing with my budget?",
    "What's my biggest expense category?",
    "Who do I spend the most money with?",
    "Show me shared expenses with family",
    "Help me manage my people in the app",
    "Compare spending to last month",
    `Add expense: ${formatCurrency(150)} lunch`,
    "Create a budget plan for next month",
    "How do I add people to my expenses?"
  ];

  const handleQuickAction = (action: string) => {
    setCurrentMessage(action);
    sendMessage(action);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading conversation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <Card className="mb-4 shadow-lg border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  KautilyaAI Co-Pilot
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Your intelligent financial advisor - bringing ancient wisdom to modern wealth
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Chat Sessions */}
              <Sheet open={showSessions} onOpenChange={setShowSessions}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="shadow-md hover:shadow-lg transition-shadow border-0">
                    <History className="h-4 w-4" />
                    <span className="hidden sm:ml-1 sm:inline">Chat History</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 backdrop-blur-md bg-background/95 shadow-2xl border-0">
                  <SheetHeader className="pb-4">
                    <SheetTitle className="flex items-center space-x-2 text-lg">
                      <div className="p-2 bg-primary/10 rounded-lg shadow-sm">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <span>Chat Sessions</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4 px-4">
                    {/* New Chat Button - Centered and styled */}
                    <div className="flex justify-center px-2">
                      <Button 
                        onClick={createNewChatSession} 
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-shadow px-6 py-2 rounded-lg font-medium text-sm border-0" 
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Chat Session
                      </Button>
                    </div>
                    
                    {/* Session List with improved styling */}
                    <div className="space-y-3 px-2">
                      {sessions.map((session) => (
                        <div 
                          key={session.id} 
                          className={`group relative p-3 mx-1 rounded-xl transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg ${
                            currentSessionId === session.id 
                              ? 'bg-primary/5 shadow-lg ring-1 ring-primary/20' 
                              : 'bg-card hover:bg-muted/30'
                          }`}
                          onClick={() => switchToSession(session.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              {editingSessionId === session.id ? (
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={() => {
                                    if (editingTitle.trim()) {
                                      renameSession(session.id, editingTitle);
                                    }
                                    setEditingSessionId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (editingTitle.trim()) {
                                        renameSession(session.id, editingTitle);
                                      }
                                      setEditingSessionId(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingSessionId(null);
                                    }
                                  }}
                                  className="h-7 text-sm font-medium shadow-sm border-0 focus:ring-2 focus:ring-primary/50"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(session.id);
                                    setEditingTitle(session.title);
                                  }}
                                  className="cursor-text group/title"
                                >
                                  <h4 className="font-semibold text-sm truncate text-foreground group-hover/title:text-primary transition-colors">
                                    {session.title}
                                  </h4>
                                </div>
                              )}
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {session.messageCount} msgs
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                                  <span className="text-xs text-muted-foreground">
                                    {session.lastActivity.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center space-x-1">
                              {currentSessionId === session.id && (
                                <Badge variant="default" className="text-xs px-2 py-1 bg-primary/10 text-primary shadow-sm border-0">
                                  Active
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(session.id);
                                }}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {sessions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                            <MessageSquare className="h-8 w-8 opacity-50" />
                          </div>
                          <h3 className="font-medium text-sm mb-1">No chat sessions yet</h3>
                          <p className="text-xs">Start a conversation to create your first session</p>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Badge variant="secondary" className="hidden sm:flex shadow-md bg-muted/80 backdrop-blur-sm">
                <MessageSquare className="h-3 w-3 mr-1" />
                {messages.filter(m => m.id !== 'welcome').length} messages
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteCurrentSession}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 shadow-md hover:shadow-lg transition-all border-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:ml-1 sm:inline">Delete Chat</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0 shadow-xl border-0">
        <CardContent className="flex-1 flex flex-col p-6 min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-primary text-primary-foreground'}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`inline-block max-w-full p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.isError
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : 'bg-muted'
                    }`}>
                      {message.role === 'assistant' && !message.isError ? (
                        <div className="text-sm prose prose-sm max-w-none overflow-hidden">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="break-words">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs break-all">{children}</code>,
                              h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-2">{children}</h3>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm break-words">{message.content}</p>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                    
                    {/* Action Items */}
                    {message.actionItems && message.actionItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.actionItems.map((action, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {action.suggestion}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-3 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="text-xs h-8"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="mt-4 flex space-x-2">
            <Input
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your finances..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!currentMessage.trim() || isLoading}
              size="default"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
