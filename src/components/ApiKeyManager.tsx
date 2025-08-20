import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Key, 
  Eye, 
  EyeOff as EyeSlash, 
  CheckCircle, 
  AlertTriangle as Warning, 
  Info 
} from 'lucide-react';
import { useKV } from '@github/spark/hooks';
import { toast } from 'sonner';

interface ApiKeyManagerProps {
  onApiKeyChange?: (hasKey: boolean) => void;
}

export function ApiKeyManager({ onApiKeyChange }: ApiKeyManagerProps) {
  const [openAiKey, setOpenAiKey, deleteOpenAiKey] = useKV('openai-api-key', '');
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const hasApiKey = Boolean(openAiKey);

  const handleSaveKey = async () => {
    if (!tempKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    if (!tempKey.startsWith('sk-')) {
      toast.error('OpenAI API key should start with "sk-"');
      return;
    }

    setTesting(true);
    try {
      // Test the API key with a simple request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${tempKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setOpenAiKey(tempKey);
        setTempKey('');
        setIsDialogOpen(false);
        toast.success('OpenAI API key saved and verified!');
        onApiKeyChange?.(true);
      } else {
        const error = await response.json();
        toast.error(`Invalid API key: ${error.error?.message || 'Authentication failed'}`);
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      toast.error('Failed to verify API key. Please check your internet connection.');
    } finally {
      setTesting(false);
    }
  };

  const handleRemoveKey = () => {
    deleteOpenAiKey();
    toast.success('OpenAI API key removed');
    onApiKeyChange?.(false);
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    return `${key.slice(0, 7)}${'*'.repeat(20)}${key.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key size={20} />
          OpenAI API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info size={16} />
          <AlertDescription>
            <strong>AI Analysis Options:</strong>
            <br />
            • <strong>Built-in:</strong> Uses Spark's built-in AI (recommended)
            <br />
            • <strong>OpenAI:</strong> Use your own OpenAI API key for GPT-4 analysis
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="font-medium">API Key Status</Label>
            <div className="flex items-center gap-2">
              {hasApiKey ? (
                <>
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle size={12} />
                    Configured
                  </Badge>
                  {showKey ? (
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {openAiKey}
                    </code>
                  ) : (
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {maskApiKey(openAiKey)}
                    </code>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </Button>
                </>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Warning size={12} />
                  Not Configured
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasApiKey && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveKey}
              >
                Remove
              </Button>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant={hasApiKey ? "outline" : "default"} size="sm">
                  {hasApiKey ? 'Update' : 'Add'} API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure OpenAI API Key</DialogTitle>
                  <DialogDescription>
                    Enter your OpenAI API key to enable advanced AI analysis. 
                    Your key is stored securely and only used for budget analysis.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <Alert>
                    <Info size={16} />
                    <AlertDescription>
                      <strong>How to get your API key:</strong>
                      <br />
                      1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com/api-keys</a>
                      <br />
                      2. Click "Create new secret key"
                      <br />
                      3. Copy and paste the key below
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="api-key">OpenAI API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="sk-..."
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setTempKey('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveKey}
                      disabled={!tempKey.trim() || testing}
                    >
                      {testing ? 'Verifying...' : 'Save & Verify'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!hasApiKey && (
          <Alert>
            <Warning size={16} />
            <AlertDescription>
              Without an OpenAI API key, the analyzer will use built-in algorithms and demo data. 
              This still provides valuable insights, but OpenAI GPT-4 offers more sophisticated analysis.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}