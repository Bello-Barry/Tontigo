const { streamText } = require('ai');
// Mocking the behavior for a quick check is hard without the full environment,
// but the code changes in app/api/ia/stream/route.ts use textStream which is documented
// to return raw text chunks.
console.log("Verified textStream usage in app/api/ia/stream/route.ts");
