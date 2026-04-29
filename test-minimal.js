async function test() {
  const res = await fetch('http://localhost:3000/api/test-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Bonjour' })
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
    if (done) break;
    process.stdout.write(decoder.decode(value));
  }
}
test();
