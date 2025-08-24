import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Loader2, Send, Bot, User, X, Camera, Mic, MicOff } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionItems?: any[];
  isError?: boolean;
}

interface GeminiChatProps {
  expenses?: any[];
  budgets?: any[];
  onClose: () => void;
  // CRUD operation callbacks - matching actual function signatures
  onAddExpense?: (expense: any) => Promise<string>;
  onUpdateExpense?: (expenseId: string, expense: Partial<any>) => Promise<void>;
  onDeleteExpense?: (expenseId: string) => Promise<void>;
  onAddBudget?: (budget: any) => Promise<string>;
  onUpdateBudget?: (budgetId: string, budget: Partial<any>) => Promise<void>;
  onDeleteBudget?: (budgetId: string) => Promise<void>;
  onAddCategory?: (category: any) => Promise<string>;
  onUpdateCategory?: (categoryId: string, category: Partial<any>) => Promise<void>;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
  onAddPerson?: (person: any) => Promise<void>;
  onUpdatePerson?: (personId: string, person: Partial<any>) => Promise<void>;
  onDeletePerson?: (personId: string) => Promise<void>;
  onAddTemplate?: (template: any) => Promise<void>;
  onUpdateTemplate?: (templateId: string, template: Partial<any>) => Promise<void>;
  onDeleteTemplate?: (templateId: string) => Promise<void>;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({ 
  expenses = [], 
  budgets = [], 
  onClose,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m KautilyaAI, your intelligent financial co-pilot. I can help you understand your spending, manage budgets, and answer questions about your finances. What would you like to know?',
      timestamp: new Date(),
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (message: string) => {
    if (!message.trim() || !user) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    try {
      // Call Firebase Function
      const chatFunction = httpsCallable(functions, 'chatWithGemini');
      const result = await chatFunction({
        userId: user.uid,
        message: message.trim(),
        context: {
          recentExpenses: expenses.slice(0, 10),
          activeBudgets: budgets.filter(b => b.isActive !== false)
        }
      });

      const data = result.data as any;
      
      if (data.success) {
        // Handle executed actions (CRUD operations)
        if (data.executedActions && data.executedActions.length > 0) {
          for (const action of data.executedActions) {
            if (action.success) {
              
              // Execute frontend CRUD operations to update UI state
              if (action.type === 'add_expense' && action.data && onAddExpense) {
                try {
                  await onAddExpense(action.data);
                  toast.success(`✅ Expense added: ₹${action.data.amount} for ${action.data.category}`, {
                    description: `ID: ${action.data.id} - ${action.data.description}`,
                    duration: 5000
                  });
                } catch (error) {
                  toast.error(`❌ Failed to sync expense to UI`);
                }
              } 
              
              else if (action.type === 'add_budget' && action.data && onAddBudget) {
                try {
                  await onAddBudget(action.data);
                  toast.success(`✅ Budget created: ₹${action.data.limit} for ${action.data.category}`);
                } catch (error) {
                  toast.error(`❌ Failed to sync budget to UI`);
                }
              } 
              
              else if (action.type === 'update_budget' && action.data && onUpdateBudget) {
                try {
                  await onUpdateBudget(action.data.id, action.data);
                  toast.success(`✅ Budget updated: ₹${action.data.limit} for ${action.data.category}`);
                } catch (error) {
                  toast.error(`❌ Failed to sync budget update to UI`);
                }
              } 
              
              else if (action.type === 'delete_expense' && action.data && onDeleteExpense) {
                try {
                  await onDeleteExpense(action.data.id);
                  toast.success(`✅ Expense deleted successfully`);
                } catch (error) {
                  toast.error(`❌ Failed to sync expense deletion to UI`);
                }
              } 
              
              else if (action.type === 'delete_budget' && action.data && onDeleteBudget) {
                try {
                  await onDeleteBudget(action.data.id);
                  toast.success(`✅ Budget deleted successfully`);
                } catch (error) {
                  toast.error(`❌ Failed to sync budget deletion to UI`);
                }
              } 
              
              else if (action.type === 'add_category' && action.data && onAddCategory) {
                try {
                  await onAddCategory(action.data);
                  toast.success(`✅ Category created: ${action.data.name}`);
                } catch (error) {
                  toast.error(`❌ Failed to sync category to UI`);
                  console.error('Category sync error:', error);
                }
              } 
              
              else if (action.type === 'update_category' && action.data && onUpdateCategory) {
                try {
                  await onUpdateCategory(action.data.id, action.data);
                  toast.success(`✅ Category updated: ${action.data.name}`);
                } catch (error) {
                  toast.error(`❌ Failed to sync category update to UI`);
                }
              } 
              
              else if (action.type === 'delete_category' && action.data && onDeleteCategory) {
                try {
                  await onDeleteCategory(action.data.id);
                  toast.success(`✅ Category deleted successfully`);
                } catch (error) {
                  toast.error(`❌ Failed to sync category deletion to UI`);
                }
              }
              
              // Handle other operations with frontend callbacks
              else if (action.type === 'add_person' && action.data && onAddPerson) {
                try {
                  await onAddPerson(action.data);
                  toast.success(`✅ Person added: ${action.data.name} (${action.data.relationship})`);
                } catch (error) {
                  toast.error(`❌ Failed to sync person to UI`);
                  console.error('Person sync error:', error);
                }
              } else if (action.type === 'update_person' && action.data && onUpdatePerson) {
                try {
                  await onUpdatePerson(action.data.id, action.data);
                  toast.success(`✅ Person updated: ${action.data.newName || action.data.name}`);
                } catch (error) {
                  toast.error(`❌ Failed to sync person update to UI`);
                  console.error('Person update sync error:', error);
                }
              } else if (action.type === 'delete_person' && action.data && onDeletePerson) {
                try {
                  await onDeletePerson(action.data.id);
                  toast.success(`✅ Person deleted: ${action.data.name}`);
                } catch (error) {
                  toast.error(`❌ Failed to sync person deletion to UI`);
                  console.error('Person deletion sync error:', error);
                }
              } else if (action.type === 'add_template' && action.data && onAddTemplate) {
                try {
                  await onAddTemplate(action.data);
                  toast.success(`✅ Template created: ${action.data.title}`);
                } catch (error) {
                  toast.error(`❌ Failed to sync template to UI`);
                  console.error('Template sync error:', error);
                }
              } else if (action.type === 'update_template' && action.data && onUpdateTemplate) {
                try {
                  await onUpdateTemplate(action.data.id, action.data);
                  toast.success(`✅ Template updated: ${action.data.title}`);
                } catch (error) {
                  toast.error(`❌ Failed to sync template update to UI`);
                  console.error('Template update sync error:', error);
                }
              } else if (action.type === 'delete_template' && action.data && onDeleteTemplate) {
                try {
                  await onDeleteTemplate(action.data.id);
                  toast.success(`✅ Template deleted: ${action.data.title}`);
                } catch (error) {
                  toast.error(`❌ Failed to sync template deletion to UI`);
                  console.error('Template deletion sync error:', error);
                }
              }
              
              // Handle operations without frontend callbacks (fallback toast only)
              else if (action.type === 'add_person' && action.data) {
                toast.success(`✅ Person added: ${action.data.name} (${action.data.relationship})`);
              } else if (action.type === 'update_person' && action.data) {
                toast.success(`✅ Person updated: ${action.data.newName || action.data.name}`);
              } else if (action.type === 'delete_person' && action.data) {
                toast.success(`✅ Person deleted: ${action.data.name}`);
              } else if (action.type === 'add_template' && action.data) {
                toast.success(`✅ Template created: ${action.data.title}`);
              } else if (action.type === 'update_template' && action.data) {
                toast.success(`✅ Template updated: ${action.data.title}`);
              } else if (action.type === 'delete_template' && action.data) {
                toast.success(`✅ Template deleted: ${action.data.title}`);
              }
              
            } else {
              toast.error(`❌ Action failed: ${action.error || 'Unknown error'}`);
            }
          }
        }

        // Add AI response
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          actionItems: data.actionItems || []
        };
        
        setMessages(prev => [...prev, aiMessage]);
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
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">KautilyaAI Co-Pilot</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Powered by Gemini AI
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
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
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={
                      message.role === 'user' 
                        ? "bg-blue-500 text-white" 
                        : message.isError 
                        ? "bg-red-500 text-white"
                        : "bg-primary text-primary-foreground"
                    }>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-[85%] p-3 rounded-lg break-words ${
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
                              li: ({ children }) => <li className="mb-1 break-words text-sm">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-blue-600">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs break-all">{children}</code>,
                              h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h3>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-b bg-muted/50">
              <p className="text-sm font-medium mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="text-xs"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your expenses, budgets, or financial goals..."
                  disabled={isLoading}
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    disabled
                    title="Voice input (coming soon)"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    disabled
                    title="Receipt scanner (coming soon)"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleSend}
                disabled={!currentMessage.trim() || isLoading}
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              Powered by Google Gemini AI • Press Enter to send
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
