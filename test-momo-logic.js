const tokenCache = {};
function getToken(product) {
  const cached = tokenCache[product];
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return "CACHED_TOKEN";
  }
  tokenCache[product] = { token: "NEW_TOKEN", expiresAt: Date.now() + 3600000 };
  return "NEW_TOKEN";
}

console.log("First call:", getToken('collection'));
console.log("Second call (cached):", getToken('collection'));
