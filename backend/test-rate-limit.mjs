// using built-in fetch

async function test() {
  console.log("Sending 10 requests to breach-check endpoint to test rate limiting...");
  
  for (let i = 1; i <= 10; i++) {
    try {
      const res = await fetch("http://localhost:4000/api/v1/breach-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: "citizen@example.com" })
      });
      
      const text = await res.text();
      console.log(`Request ${i}: Status ${res.status}`);
      if (res.status === 429) {
          console.log(`  -> Rate limit hit! Response: ${text}`);
      }
    } catch (e) {
      console.log(`Request ${i} failed:`, e.message);
    }
  }
}

test();
