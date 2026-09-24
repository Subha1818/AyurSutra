import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { aiService } from '@/lib/api';

// Type definitions
interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface Therapy {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface ScheduleRecommendation {
  time: string;
  reason: string;
  confidence: number;
}

// AI Chatbot Widget Component
export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hello! I\'m your Panchakarma assistant. How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.getChatbotResponse(inputMessage);
      const botMessage: Message = { role: 'bot', content: response.response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = { role: 'bot', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 bg-green-600 hover:bg-green-700 shadow-lg"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50 flex flex-col animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-green-600 text-white p-4 rounded-t-lg flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="font-medium">Panchakarma Assistant</span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'bot' && (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-green-600" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about therapies, booking..."
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={isLoading} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

// Therapy Suggestion Component
export const TherapySuggestions: React.FC<{
  symptoms: string[];
  goals: string[];
  onSuggestionSelect?: (therapy: Therapy) => void;
}> = ({ symptoms, goals, onSuggestionSelect }) => {
  const [suggestions, setSuggestions] = useState<Therapy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (symptoms.length > 0 || goals.length > 0) {
      fetchSuggestions();
    }
  }, [symptoms, goals]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await aiService.getTherapySuggestions(symptoms, goals);
      setSuggestions(result);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Therapy Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-green-600" />
          AI Therapy Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((therapy, index) => (
            <div
              key={therapy.id}
              className="p-4 border rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
              onClick={() => onSuggestionSelect?.(therapy)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{therapy.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{therapy.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{therapy.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    AI Recommended
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const SmartScheduler: React.FC<{
  availableSlots?: string[];
  onScheduleSelect?: (schedule: ScheduleRecommendation) => void;
}> = ({ availableSlots, onScheduleSelect }) => {
  const recommendations: ScheduleRecommendation[] = React.useMemo(() => {
    if (availableSlots && availableSlots.length > 0) {
      return availableSlots.slice(0, 3).map((slot, idx) => ({
        time: slot,
        reason: idx === 0 ? 'Optimal time for Vata balance & clinic throughput' : idx === 1 ? 'Ideal alignment for Pitta therapies' : 'Recommended opening for calm recuperation',
        confidence: idx === 0 ? 96 : idx === 1 ? 88 : 75
      }));
    }
    return [
      { time: '10:00 AM', reason: 'Optimal time for Vata balance', confidence: 95 },
      { time: '2:00 PM', reason: 'Good for Pitta therapies', confidence: 87 },
      { time: '4:00 PM', reason: 'Alternative slot available', confidence: 72 },
    ];
  }, [availableSlots]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          AI Schedule Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => onScheduleSelect?.(rec)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{rec.time}</span>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                </div>
                <Badge variant={rec.confidence > 90 ? 'default' : 'secondary'}>
                  {rec.confidence}% match
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Notes Summarizer Component
export const NotesSummarizer: React.FC<{
  notes: string;
  onSummaryGenerated?: (summary: string) => void;
}> = ({ notes, onSummaryGenerated }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateSummary = async () => {
    if (!notes.trim()) return;

    setIsLoading(true);
    try {
      const result = await aiService.summarizeNotes(notes);
      setSummary(result);
      onSummaryGenerated?.(result);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          AI Notes Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={generateSummary}
          disabled={isLoading || !notes.trim()}
          className="mb-4"
        >
          {isLoading ? 'Generating...' : 'Generate AI Summary'}
        </Button>
        {summary && (
          <div className="p-4 bg-purple-50 rounded-lg border">
            <h4 className="font-medium mb-2">AI Generated Summary:</h4>
            <p className="text-sm text-gray-700">{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};