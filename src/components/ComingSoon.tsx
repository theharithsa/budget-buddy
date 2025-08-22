import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, TrendingUp, Brain, Zap, Calendar } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  version?: string;
  features?: string[];
}

export function ComingSoon({ 
  title, 
  description, 
  version = "4.0", 
  features = [] 
}: ComingSoonProps) {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-lg">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Sparkles className="w-4 h-4 mr-1" />
            Coming in v{version}
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Calendar className="w-4 h-4 mr-1" />
            Release TBD
          </Badge>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.length > 0 ? (
          features.map((feature, index) => (
            <Card key={index} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  {index === 0 && <Brain className="w-5 h-5 text-primary" />}
                  {index === 1 && <TrendingUp className="w-5 h-5 text-primary" />}
                  {index === 2 && <Zap className="w-5 h-5 text-primary" />}
                  {index > 2 && <Sparkles className="w-5 h-5 text-primary" />}
                </div>
                <CardTitle className="text-lg">{feature}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded-full">
                  <div className="h-3 bg-primary/30 rounded-full w-3/4"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">In Development</p>
              </CardContent>
            </Card>
          ))
        ) : (
          // Default preview cards if no features provided
          <>
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Smart Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-powered financial analysis with personalized recommendations
                </CardDescription>
                <div className="h-3 bg-muted rounded-full mt-3">
                  <div className="h-3 bg-primary/30 rounded-full w-3/4"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">In Development</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Predictive Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Forecast spending patterns and budget optimization suggestions
                </CardDescription>
                <div className="h-3 bg-muted rounded-full mt-3">
                  <div className="h-3 bg-primary/30 rounded-full w-2/3"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">In Development</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Auto Categorization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Intelligent expense categorization and duplicate detection
                </CardDescription>
                <div className="h-3 bg-muted rounded-full mt-3">
                  <div className="h-3 bg-primary/30 rounded-full w-1/2"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">In Development</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">Stay Tuned!</h3>
            <p className="text-muted-foreground mb-4">
              We're working hard to bring you the most advanced AI-powered financial insights. 
              The new AI Analyzer will transform how you understand and manage your finances.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Bot className="w-4 h-4" />
                <span>Powered by Advanced AI</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen Analytics</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
