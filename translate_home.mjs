import fs from 'fs';
import path from 'path';

const LOCALES_DIR = String.raw`C:\Users\callz\OneDrive\Documents\My Projects\SynologyDrive\Websites\CareNet 2\src\locales`;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const LANGUAGES = {
  am: "Amharic", ar: "Arabic", da: "Danish", de: "German",
  el: "Greek", es: "Spanish", fa: "Persian/Farsi", fi: "Finnish",
  fr: "French", gu: "Gujarati", he: "Hebrew", hi: "Hindi",
  id: "Indonesian", it: "Italian", ja: "Japanese", kn: "Kannada",
  ko: "Korean", ml: "Malayalam", mr: "Marathi", ms: "Malay",
  my: "Burmese/Myanmar", ne: "Nepali", nl: "Dutch", no: "Norwegian",
  pa: "Punjabi", pl: "Polish", pt: "Portuguese", ru: "Russian",
  si: "Sinhala", sv: "Swedish", sw: "Swahili", ta: "Tamil",
  te: "Telugu", th: "Thai", tr: "Turkish", ur: "Urdu",
  vi: "Vietnamese", zh: "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)", zu: "Zulu"
};

const HOME_EN = {
  contact: {
    emailLabel: "Email",
    emailNow: "Email Now",
    hotline: "Hotline",
    sendSms: "Send SMS",
    title: "Need Help?"
  },
  features: {
    agency: {
      description: "Licensed, high-performing agencies with proven reliability and compliance standards.",
      title: "Vetted Agency Network"
    },
    platform: {
      description: "Discover, book, manage, communicate, pay, and track—everything from one powerful dashboard.",
      title: "Single Integrated Platform"
    },
    sectionTitle: "Why CareNet?",
    tracking: {
      description: "Full visibility into caregiver schedules and service delivery—bringing transparency and accountability.",
      title: "Real-Time Care Tracking"
    },
    verified: {
      description: "Background-checked, certified, and trusted professionals—screened through police verification, health checks, and psychological evaluation.",
      title: "Verified Caregivers"
    }
  },
  hero: {
    brand: "CareNet",
    careShop: "Care Shop",
    jobPortal: "Job Portal",
    register: "Register",
    subtitle: "Bangladesh's trusted platform for connecting families with verified caregivers and professional agencies",
    tagline: "Quality care, connected"
  }
};

async function translateHome(langCode, langName) {
  const prompt = `Translate the following JSON object values into ${langName} (language code: ${langCode}).
Rules:
- Keep all JSON keys exactly as-is
- Only translate the string values
- Keep "CareNet" as-is (it is a brand name, do not translate it)
- Return ONLY valid JSON with no markdown fences, no explanation, nothing else

JSON to translate:
${JSON.stringify(HOME_EN, null, 2)}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      temperature: 0.1,
      messages: [
        { role: "system", content: "You are a professional translator. Return only valid JSON, no markdown, no explanation." },
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) throw new Error(`API error: ${JSON.stringify(data)}`);
  let text = data.choices[0].message.content.trim();
  // Strip markdown fences if model ignores instructions
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(text);
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error("ERROR: Set OPENAI_API_KEY environment variable first.");
    console.error("Run: $env:OPENAI_API_KEY = 'sk-...'");
    process.exit(1);
  }

  const langs = Object.entries(LANGUAGES);
  console.log(`Translating home section for ${langs.length} languages using GPT-4.1...\n`);

  let ok = 0, fail = 0;
  for (const [code, name] of langs) {
    const filePath = path.join(LOCALES_DIR, code, 'common.json');
    if (!fs.existsSync(filePath)) {
      console.log(`SKIP  ${code}: file not found`);
      continue;
    }
    try {
      process.stdout.write(`[${code}] ${name}... `);
      const translated = await translateHome(code, name);
      const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      file.home = translated;
      fs.writeFileSync(filePath, JSON.stringify(file, null, 2) + '\n', 'utf8');
      console.log('OK');
      ok++;
    } catch (err) {
      console.log(`FAIL — ${err.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone. ${ok} translated, ${fail} failed.`);
}

main();
