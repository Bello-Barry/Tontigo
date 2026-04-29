async function test() {
  const res = await fetch('http://localhost:3000/api/ia/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Bonjour',
      history: [],
      conversationId: null
    })
  });

  console.log('Status:', res.status);
  
  if (!res.body) {
    console.log("No response body. Text:", await res.text());
    return;
  }
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('Done');
      break;
    }
    console.log('Chunk:', decoder.decode(value));
  }
}

test();
