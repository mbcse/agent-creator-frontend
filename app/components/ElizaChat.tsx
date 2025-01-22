"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';
import { Loader2, XCircle, RefreshCw, AlertTriangle, ArrowRight, Sparkles, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { jsonrepair } from 'jsonrepair'

const ElizaChat = () => {
  const messagesEndRef = useRef(null);
  const [jsonData, setJsonData] = useState({
    name: "",
    bio: "",
    lore: "",
    knowledge: [],
    messageExamples: [],
    postExamples: [],
    topics: [],
    style: {
      all: [],
      chat: [],
      post: []
    },
    adjectives: [],
    clients: [],
    plugins: [],
    settings: {}
  });

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload, stop } = useChat({
    streamProtocol: 'text',
    api: 'http://localhost:3002/characterFile'
  });

  const extractJsonAndMessage = (content) => {
    try {
      // First try to parse as complete JSON
      const parsed = JSON.parse(content);
      if (parsed.message && parsed.characterFileJson) {
        return { message: parsed.message, json: parsed.characterFileJson };
      }
    } catch (e) {
      console.log('Initial parse failed:', e);

      // Try to extract just the message if JSON parse fails
      try {
        // Look for message field with various possible formats
        const messagePatterns = [
          /"message":\s*"((?:[^"\\]|\\.)*)"/,  // Standard JSON format
          /message":\s*"([^"]+)"/,              // Less strict format
          /"message":\s*"([\s\S]*?)(?:"|$)/     // Very lenient format
        ];
  
        for (const pattern of messagePatterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            // Found a message, try to find accompanying JSON
            try {
              const jsonRegex = /"characterFileJson"\s*:\s*({[\s\S]*?})(?=\s*[,}]|$)/;
              const jsonMatch = content.match(jsonRegex);
              const json = jsonMatch ? JSON.parse(jsonMatch[1]) : null;
              
              return {
                message: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
                json: json
              };
            } catch (jsonError) {
              // If JSON extraction fails, return just the message
              return {
                message: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
                json: null
              };
            }
          }
        }
      } catch (extractError) {
        console.log('Message extraction failed:', extractError);
      }
  
      // If no message found, try to clean up the content
      if (typeof content === 'string') {
        // Remove markdown code blocks if present
        const cleanContent = content.replace(/```json\n[\s\S]*?\n```/g, '').trim();
        
        // If content looks like a message, return it
        if (cleanContent.length > 0 && cleanContent.length < 1000) {
          return {
            message: cleanContent,
            json: null
          };
        }
      }
    }
  
    // Fallback to returning the raw content
    return {
      message: typeof content === 'string' ? content : 'Invalid content',
      json: null
    };
  };

  useEffect(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[assistantMessages.length - 1];
      const { json } = extractJsonAndMessage(lastMessage.content);
      if (json) {
        setJsonData(prev => ({
          ...prev,
          ...json,
          style: {
            ...prev.style,
            ...(json.style || {})
          }
        }));
      }
    }
  }, [messages]);

  const renderSection = (title, content, type = 'string') => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;
    
    return (
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h3 className="text-lg font-semibold text-indigo-600 mb-2">{title}</h3>
        {type === 'string' ? (
          <p className="text-gray-700">{content}</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {content.map((item, index) => (
              <li key={index} className="text-gray-700">{item}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderMessageSection = (title, content) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;
    
    return (
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h3 className="text-lg font-semibold text-indigo-600 mb-2">{title}</h3>
        <div className="space-y-4">
          {content.map((item, index) => (
            <div key={index} className="border-l-4 border-indigo-200 pl-4">
              <p className="font-medium text-gray-800 mb-1">Q: {item[0].content.text}</p>
              <p className="text-gray-600">A: {item[1].content.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSettingsSection = (title, content) => {
    if (!content || !content.secrets || JSON.stringify(content.secrets) == JSON.stringify({}) || (Array.isArray(content) && content.length === 0)) return null;
    
    return (
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h3 className="text-lg font-semibold text-indigo-600 mb-2">{title}</h3>
        <div className="space-y-4">
          {content?.secrets && Object.keys(content?.secrets).map((item, index) => (
            <div key={index} className="border-l-4 border-indigo-200 pl-4">
              <p className="font-medium text-gray-800 mb-1">{item}</p>
              <p className="text-gray-600">{content?.secrets[item]}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AgenticFleek</h1>
            <p className="text-sm text-gray-500">Create agents though prompt in seconds</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Left Panel - Chat */}
        <div className="w-1/2 flex flex-col border-r min-h-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const { message: displayMessage } = extractJsonAndMessage(message.content);
              
              return (
                <div key={message.id} 
                  className={`p-4 rounded-xl ${
                    message.role === 'assistant' 
                      ? 'bg-white border border-indigo-100' 
                      : 'bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'assistant' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                        : 'bg-white'
                    }`}>
                      {message.role === 'assistant' ? '🤖' : '👤'}
                    </div>
                    <span className="font-medium">
                      {message.role === 'assistant' ? 'AI' : 'You'}
                    </span>
                  </div>
                  <div className="ml-10 text-gray-700">{displayMessage}</div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-2 p-4">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            <form onSubmit={handleSubmit} className="relative">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Describe your character..."
                disabled={isLoading}
                className="w-full pl-4 pr-24 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  type="submit"
                  disabled={isLoading || !input}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel - JSON Preview with independent scroll */}
        <div className="w-1/2 overflow-y-auto">
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-purple-900 mb-6 text-center">AGENT CHARACTER FILE PREVIEW</h2>
            {renderSection('Name', jsonData.name, 'string')}
            {renderSection('Clients', jsonData.clients, 'array')}
            {renderSection('Plugins', jsonData.plugins, 'array')}
            {renderSettingsSection('Settings', jsonData.settings)}
            {renderSection('Biography', jsonData.bio, 'array')}
            {renderSection('Lore', jsonData.lore, 'array')}
            {renderSection('Knowledge Base', jsonData.knowledge, 'array')}
            {renderSection('Topics', jsonData.topics, 'array')}
            {renderSection('Adjectives', jsonData.adjectives, 'array')}
            {renderMessageSection('Message Examples', jsonData.messageExamples)}
            {renderSection('Post Examples', jsonData.postExamples, 'array')}
            
            {/* Style Sections */}
            {(jsonData.style?.all?.length > 0 || jsonData.style?.chat?.length > 0 || jsonData.style?.post?.length > 0) && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-indigo-600 mb-4">Style</h3>
                {jsonData.style?.all?.length > 0 && renderSection('General', jsonData.style.all, 'array')}
                {jsonData.style?.chat?.length > 0 && renderSection('Chat', jsonData.style.chat, 'array')}
                {jsonData.style?.post?.length > 0 && renderSection('Post', jsonData.style.post, 'array')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">Failed to send message. Please try again.</span>
            </div>
            <button
              onClick={reload}
              className="px-4 py-2 bg-white text-red-500 rounded-lg hover:bg-red-50 border border-red-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElizaChat;