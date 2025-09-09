'use client';

import { FormViewer } from '@forms/runtime';

const demoSchema = {
  id: 'demo-form',
  version: 1,
  blocks: [
    {
      id: 'name',
      type: 'text' as const,
      question: 'What is your name?',
      description: 'Please enter your full name',
      required: true,
      properties: {
        placeholder: 'John Doe'
      }
    },
    {
      id: 'email',
      type: 'email' as const,
      question: 'What is your email address?',
      required: true,
      validation: [
        {
          type: 'pattern' as const,
          value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          message: 'Please enter a valid email address'
        }
      ]
    },
    {
      id: 'reason',
      type: 'dropdown' as const,
      question: 'Why are you contacting us?',
      required: true,
      properties: {
        options: ['General Inquiry', 'Support', 'Sales', 'Feedback']
      }
    },
    {
      id: 'message',
      type: 'long_text' as const,
      question: 'Tell us more',
      description: 'Please provide as much detail as possible',
      properties: {
        rows: 5,
        placeholder: 'Type your message here...'
      }
    },
    {
      id: 'rating',
      type: 'rating' as const,
      question: 'How would you rate your experience?',
      properties: {
        max: 5
      }
    }
  ],
  settings: {
    submitText: 'Send Message',
    showProgressBar: true,
    thankYouMessage: '<h2>Thank you!</h2><p>We will get back to you soon.</p>'
  },
  theme: {
    primaryColor: '#4F46E5',
    fontFamily: 'system-ui',
    borderRadius: '8px',
    spacing: '1rem'
  }
};

export default function DemoPage() {
  return (
    <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        Form Runtime Demo
      </h1>
      
      <FormViewer
        schema={demoSchema}
        config={{
          formId: 'demo-form',
          apiUrl: 'http://localhost:8000/v1',
          enableOffline: true,
          autoSaveInterval: 3000,
          onSubmit: async (data) => {
            console.log('Form submitted:', data);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
          },
          onPartialSave: (data) => {
            console.log('Auto-saved:', data);
          },
          onError: (error) => {
            console.error('Form error:', error);
          }
        }}
      />
    </div>
  );
}