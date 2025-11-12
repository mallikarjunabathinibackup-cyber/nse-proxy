// api/nse.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { from, to, symbol = "NIFTY", optionType = "CE" } = req.query;
  const instrumentType = "OPTIDX";

  const base = "https://www.nseindia.com";
  const apiUrl = `${base}/api/historicalOR/foCPV?from=${from}&to=${to}&instrumentType=${instrumentType}&symbol=${symbol}&optionType=${optionType}`;

  try {
    // 1️⃣ Step 1: Get cookies and session headers
    const init = await fetch(base, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "cache-control": "no-cache",
      },
    });

    const cookies = init.headers.get("set-cookie");

    // 2️⃣ Step 2: Call the real API with cookies + realistic headers
    const apiResponse = await fetch(apiUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "referer": base + "/",
        "cookie": cookies,
        "x-requested-with": "XMLHttpRequest",
        "pragma": "no-cache",
        "cache-control": "no-cache",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
      },
    });

    const text = await apiResponse.text();

    // 3️⃣ Retry logic (if first call blocked)
    if (text.startsWith("<")) {
      console.warn("⚠️ NSE returned HTML, retrying with delay...");
      await new Promise((r) => setTimeout(r, 1200));

      const retryResponse = await fetch(apiUrl, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
          "accept": "application/json, text/plain, */*",
          "referer": base + "/",
          "cookie": cookies,
          "x-requested-with": "XMLHttpRequest",
        },
      });

      const retryText = await retryResponse.text();
      if (retryText.startsWith("<")) {
        throw new Error("NSE still returned HTML page (blocked).");
      }
      const retryJson = JSON.parse(retryText);
      return res.status(200).json(retryJson);
    }

    // 4️⃣ Success
    const json = JSON.parse(text);
    res.status(200).json(json);
  } catch (err) {
    console.error("Error fetching NSE data:", err);
    res.status(500).json({ error: err.message });
  }
}
