export async function extractUrl(url: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: 'text/plain' },
  });

  if (!res.ok) {
    throw new Error(`Jina AI retornou status ${res.status}`);
  }

  const text = await res.text();
  return text.trim();
}
