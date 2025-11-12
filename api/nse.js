// File: api/nse.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { from, to, symbol = "NIFTY", optionType = "CE" } = req.query;
  const instrumentType = "OPTIDX";

  const base = "https://www.nseindia.com";
  const apiUrl = `${base}/api/historicalOR/foCPV?from=${from}&to=${to}&instrumentType=${instrumentType}&symbol=${symbol}&optionType=${optionType}`;

  try {
    // 1️⃣ Initial fetch to get cookies
    const init = await fetch(base, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
      },
    });

    const cookie = init.headers.get("set-cookie");

    // 2️⃣ Now fetch actual data with proper headers
    const response = await fetch(apiUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "referer": base,
        "cookie": cookie,
      },
    });

    const text = await response.text();

    // 3️⃣ NSE sometimes returns HTML on first try — retry once
    if (text.startsWith("<")) {
      console.warn("⚠️ NSE returned HTML, retrying...");
      await new Promise((r) => setTimeout(r, 1000));
      return handler(req, res);
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching NSE data:", err);
    return res.status(500).json({ error: err.message });
  }
}
