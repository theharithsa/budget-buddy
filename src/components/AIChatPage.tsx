import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Loader2, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  History,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
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
  actionItems?: any[];
  isError?: boolean;
}

export const AIChatPage: React.FC = () => {
  const { user } = useAuth();
  const { expenses, budgets } = useFirestoreData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history from Firestore
  useEffect(() => {
    if (!user) return;

    const conversationRef = collection(db, `users/${user.uid}/conversations`);
    const q = query(conversationRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: ChatMessage[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          actionItems: data.actionItems,
          isError: data.isError
        });
      });

      if (loadedMessages.length === 0) {
        // Add welcome message if no history
        loadedMessages.push({
          id: 'welcome',
          role: 'assistant',
          content: `## Welcome to AI Chat! 🤖

I'm your **AI Financial Assistant** for Budget Buddy. I can help you:

- **Analyze your spending patterns** 📊
- **Track and categorize expenses** 💰
- **Create and manage budgets** 📈
- **Get personalized financial advice** 💡
- **Answer questions about your finances** ❓

Try asking me something like:
- *"Show me my spending this month"*
- *"How am I doing with my budget?"*
- *"What's my biggest expense category?"*

Let's start managing your finances smarter! 🚀`,
          timestamp: new Date(),
        });
      }

      setMessages(loadedMessages);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save message to Firestore
  const saveMessageToHistory = async (message: ChatMessage) => {
    if (!user || message.id === 'welcome') return;

    try {
      await addDoc(collection(db, `users/${user.uid}/conversations`), {
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        actionItems: message.actionItems || [],
        isError: message.isError || false
      });
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
          activeBudgets: budgets.filter(b => (b as any).isActive !== false)
        }
      });

      const data = result.data as any;
      
      if (data.response) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
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

  const clearHistory = async () => {
    if (!user) return;

    try {
      const conversationRef = collection(db, `users/${user.uid}/conversations`);
      const q = query(conversationRef);
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  // Quick action suggestions
  const quickActions = [
    "Show my spending this month",
    "How am I doing with my budget?",
    "What's my biggest expense category?",
    "Compare spending to last month",
    `Add expense: ${formatCurrency(150)} lunch`,
    "Create a budget plan for next month"
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
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Financial Assistant</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Get personalized insights and manage your finances with AI
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="hidden sm:flex">
                <History className="h-3 w-3 mr-1" />
                {messages.filter(m => m.id !== 'welcome').length} messages
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:ml-1 sm:inline">Clear History</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
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
