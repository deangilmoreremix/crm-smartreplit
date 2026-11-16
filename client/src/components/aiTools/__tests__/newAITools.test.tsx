import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StructuredDataExtraction, { buildExtractionSchema } from '../StructuredDataExtraction';
import SpeechToTextContent from '../SpeechToTextContent';

const jsonResponse = (body: any, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('Structured Data Extraction', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  it('builds a strict schema with every field required and nullable', () => {
    const schema: any = buildExtractionSchema([
      { name: 'name', type: 'string' },
      { name: 'deal_value', type: 'number' },
    ]);
    const item = schema.properties.records.items;
    expect(item.required).toEqual(['name', 'deal_value']);
    expect(item.additionalProperties).toBe(false);
    expect(item.properties.deal_value).toEqual({ anyOf: [{ type: 'number' }, { type: 'null' }] });
  });

  it('sends the text with a JSON schema to /api/ai/generate and shows the records', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, content: '', data: { records: [{ name: 'Ada', email: 'ada@x.com', company: null }] } })
    );
    render(<StructuredDataExtraction />);
    fireEvent.change(screen.getByPlaceholderText(/Paste text/), { target: { value: 'Ada <ada@x.com>' } });
    fireEvent.click(screen.getByText('Extract data'));

    await waitFor(() => expect(screen.getByText('Ada')).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/ai/generate');
    const body = JSON.parse(init.body);
    expect(body.schemaName).toBe('extraction');
    expect(body.schema.properties.records.items.required).toEqual(['name', 'email', 'company']);
    expect(body.prompt).toContain('Ada <ada@x.com>');
  });

  it('shows the server error instead of placeholder data', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false, message: 'Add your OpenAI API key' }, 400));
    render(<StructuredDataExtraction />);
    fireEvent.change(screen.getByPlaceholderText(/Paste text/), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Extract data'));
    await waitFor(() => expect(screen.getByText('Add your OpenAI API key')).toBeInTheDocument());
  });
});

describe('Speech to Text', () => {
  it('uploads the audio file to /api/ai/transcribe and shows the transcript', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, text: 'Hello from the call' }));
    global.fetch = fetchMock as any;
    render(<SpeechToTextContent />);

    const file = new File(['audio-bytes'], 'call.mp3', { type: 'audio/mpeg' });
    fireEvent.change(screen.getByLabelText('Upload audio'), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText('Hello from the call')).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/ai/transcribe?');
    expect(url).toContain('filename=call.mp3');
    expect(init.headers['Content-Type']).toBe('application/octet-stream');
    expect(init.body).toBe(file);
  });

  it('rejects files over the upload limit without calling the server', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as any;
    render(<SpeechToTextContent />);
    const big = new File([new Uint8Array(7 * 1024 * 1024)], 'long.wav', { type: 'audio/wav' });
    fireEvent.change(screen.getByLabelText('Upload audio'), { target: { files: [big] } });
    await waitFor(() => expect(screen.getByText(/too large/)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
