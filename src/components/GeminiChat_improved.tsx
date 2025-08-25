import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { X, Bot, User, Send, Loader2, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionItems?: any[];
  wisdomSuggestions?: string[];
  dailyWisdom?: string;
  isError?: boolean;
}

interface GeminiChatProps {
  onClose: () => void;
  onAddExpense?: (amount: number, category: string, description: string, peopleIds?: string[]) => Promise<void>;
  onUpdateExpense?: (id: string, updates: any) => Promise<void>;
  onDeleteExpense?: (id: string) => Promise<void>;
  onAddBudget?: (category: string, amount: number, period: string) => Promise<void>;
  onUpdateBudget?: (id: string, updates: any) => Promise<void>;
  onDeleteBudget?: (id: string) => Promise<void>;
  onAddCategory?: (name: string, color: string, icon: string) => Promise<void>;
  onUpdateCategory?: (id: string, updates: any) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({
  onClose,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const { user } = useAuth();
  const { 
    expenses, 
    budgets, 
    customPeople, 
    publicPeople,
    addExpense,
    updateExpense,
    deleteExpense,
    addBudget,
    updateBudget,
    deleteBudget,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory
  } = useFirestoreData();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! 🙏 I'm **KautilyaAI**, your intelligent financial advisor for Budget Buddy. Named after the ancient Indian philosopher and economist Chanakya (Kautilya), I bring wisdom to your wealth management.

## What I can help you with:

**💰 Expense Management**
• Add new expenses with smart categorization
• Analyze your spending patterns and trends
• Track expenses by people and categories

**📊 Budget Planning** 
• Create and manage budgets for different categories
• Monitor budget utilization and provide alerts
• Suggest budget optimizations based on your spending

**🎯 Financial Insights**
• Provide personalized spending analysis
• Offer actionable recommendations
• Share ancient wisdom on wealth management

**📈 Analytics & Reports**
• Generate spending summaries and trends
• Compare expenses across time periods
• Identify areas for potential savings

Let's start managing your finances with ancient wisdom and modern AI! 🚀`,
      timestamp: new Date(),
      wisdomSuggestions: [
        "\"He who is overly attached to his family members experiences fear and sorrow, for the root of all grief is attachment.\" - Start with mindful spending habits."
      ]
    }
  ]);

  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save message to chat history
  const saveMessageToHistory = async (message: ChatMessage) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'users', user.uid, 'chatHistory'), {
        ...message,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving message to history:', error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    console.log('🚀 SEND MESSAGE CALLED with:', messageText);
    setIsLoading(true);
    setCurrentMessage('');

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to Firestore
    await saveMessageToHistory(userMessage);

    try {
      // Call Firebase Function
      const response = await fetch('https://us-central1-finbuddy-ai.cloudfunctions.net/chatWithGemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          expenses: expenses.slice(0, 50), // Send recent expenses for context
          budgets: budgets,
          people: [...customPeople, ...publicPeople],
          userId: user?.uid
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Execute any action items if present
        if (data.actionItems && data.actionItems.length > 0) {
          for (const action of data.actionItems) {
            try {
              switch (action.type) {
                case 'ADD_EXPENSE':
                  if (onAddExpense) {
                    await onAddExpense(action.amount, action.category, action.description, action.peopleIds);
                  } else if (addExpense) {
                    await addExpense({
                      amount: action.amount,
                      category: action.category,
                      description: action.description,
                      date: new Date().toISOString().split('T')[0],
                      peopleIds: action.peopleIds || []
                    });
                  }
                  break;
                case 'ADD_BUDGET':
                  if (onAddBudget) {
                    await onAddBudget(action.category, action.amount, action.period || 'monthly');
                  } else if (addBudget) {
                    await addBudget({
                      category: action.category,
                      limit: action.amount,
                      spent: 0
                    });
                  }
                  break;
                default:
                  console.log('Unknown action type:', action.type);
              }
            } catch (actionError) {
              console.error('Error executing action:', actionError);
            }
          }
        }

        // Add AI response with wisdom
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          actionItems: data.actionItems || [],
          wisdomSuggestions: data.wisdomSuggestions || [],
          dailyWisdom: data.dailyWisdom
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Save AI response to Firestore
        await saveMessageToHistory(aiMessage);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again. Make sure you have set up the Gemini API key in Firebase Functions.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to Firestore
      await saveMessageToHistory(errorMessage);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    console.log('🎯 HANDLE SEND CALLED with currentMessage:', currentMessage);
    console.log('📤 About to call sendMessage...');
    sendMessage(currentMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action suggestions
  const quickActions = [
    "Show my spending this month",
    "How am I doing with my budget?",
    "What's my biggest expense category?",
    "Compare spending to last month",
    "Add expense: ₹150 lunch",
  ];

  const handleQuickAction = (action: string) => {
    setCurrentMessage(action);
    sendMessage(action);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <CardHeader className="flex-shrink-0 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  KautilyaAI Co-Pilot
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Powered by Gemini AI • Ancient Wisdom meets Modern AI
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex items-start gap-3 max-w-[85%] ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={
                        message.role === 'user' 
                          ? "bg-blue-500 text-white" 
                          : message.isError 
                          ? "bg-red-500 text-white"
                          : "bg-gradient-to-br from-primary to-blue-600 text-white"
                      }>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`p-3 rounded-lg shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.isError
                          ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-200'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border'
                      }`}>
                        {message.role === 'assistant' && !message.isError ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-sm">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-sm">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed text-sm">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-blue-600 dark:text-blue-400">{children}</strong>,
                                em: ({ children }) => <em className="italic text-purple-600 dark:text-purple-400">{children}</em>,
                                code: ({ children }) => <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">{children}</code>,
                                h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h3>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                      
                      <p className={`text-xs text-muted-foreground mt-1 ${
                        message.role === 'user' ? 'text-right' : ''
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                      
                      {/* Action Items */}
                      {message.actionItems && message.actionItems.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mt-2 ${
                          message.role === 'user' ? 'justify-end' : ''
                        }`}>
                          {message.actionItems.map((action, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs px-2 py-1">
                              {action.suggestion}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Wisdom Suggestions - Enhanced Visibility */}
                      {message.wisdomSuggestions && message.wisdomSuggestions.length > 0 && (
                        <div className="mt-3 p-4 bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 dark:from-amber-900/60 dark:via-yellow-900/60 dark:to-orange-900/60 rounded-lg border-2 border-amber-400 dark:border-amber-500 shadow-lg">
                          <div className="text-base font-bold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                            💡 <span>Wisdom from Kautilya</span>
                          </div>
                          <div className="space-y-2">
                            {message.wisdomSuggestions.map((wisdom, idx) => (
                              <p key={idx} className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed font-semibold italic">
                                "{wisdom}"
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Daily Wisdom - Enhanced Visibility */}
                      {message.dailyWisdom && (
                        <div className="mt-3 p-4 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/60 dark:via-indigo-900/60 dark:to-purple-900/60 rounded-lg border-2 border-blue-400 dark:border-blue-500 shadow-lg">
                          <div className="text-base font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                            📜 <span>Daily Wisdom</span>
                          </div>
                          <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed font-semibold italic">
                            "{message.dailyWisdom}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-[85%]">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border shadow-sm">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Thinking with ancient wisdom...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Quick Actions - Only show when no conversation */}
          {messages.length === 1 && (
            <div className="p-4 border-t bg-muted/20">
              <p className="text-sm font-medium text-muted-foreground mb-3">💫 Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="text-xs h-8 px-3 hover:bg-primary/10"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your finances, budgets, or financial wisdom..."
                disabled={isLoading}
                className="flex-1 h-11 text-sm border-gray-200 dark:border-gray-700 focus:border-primary"
              />
              <Button 
                onClick={handleSend} 
                disabled={!currentMessage.trim() || isLoading}
                size="default"
                className="h-11 px-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              🤖 Powered by Google Gemini AI • Press Enter to send • Ancient Wisdom meets Modern AI
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
