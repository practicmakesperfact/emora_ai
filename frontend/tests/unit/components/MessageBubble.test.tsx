import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { Message } from '@/types';

const mockUserMessage: Message = {
  id: 1,
  conversation_id: 1,
  role: 'user',
  content: 'Hello, how are you?',
  is_crisis_triggered: false,
  created_at: new Date().toISOString(),
};

const mockAiMessage: Message = {
  id: 2,
  conversation_id: 1,
  role: 'assistant',
  content: 'I am here to help you. **bold text**',
  is_crisis_triggered: false,
  created_at: new Date().toISOString(),
  source_citations: {
    sources: [
      { title: 'Coping Resource', source: 'Mental Health Docs' }
    ]
  }
};

describe('MessageBubble Component', () => {
  it('renders a user message correctly', () => {
    render(<MessageBubble message={mockUserMessage} />);
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    // User message should have indigo background
    const bubble = screen.getByText('Hello, how are you?').parentElement;
    expect(bubble).toHaveClass('bg-indigo-600', 'text-white');
  });

  it('renders an AI message with markdown correctly', () => {
    render(<MessageBubble message={mockAiMessage} />);
    // Markdown 'bold text' should be rendered in a <strong> tag
    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('bold text').tagName).toBe('STRONG');
    expect(screen.getByText(/I am here to help you/)).toBeInTheDocument();
  });

  it('displays citations if present on AI message', () => {
    render(<MessageBubble message={mockAiMessage} />);
    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(screen.getByText(/Coping Resource/)).toBeInTheDocument();
    expect(screen.getByText(/Mental Health Docs/)).toBeInTheDocument();
  });

  it('shows crisis warning badge if triggered', () => {
    const crisisMsg = { ...mockUserMessage, is_crisis_triggered: true };
    render(<MessageBubble message={crisisMsg} />);
    expect(screen.getByText('Support note')).toBeInTheDocument();
  });
});
