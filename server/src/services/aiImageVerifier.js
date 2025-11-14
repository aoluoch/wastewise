const { GoogleGenerativeAI } = require('@google/generative-ai')
const axios = require('axios')

/**
 * Verify images depict waste/trash and not people/selfies/etc.
 * Returns { allowed: boolean, reasons?: string[] }
 */
async function verifyImagesAreWaste(imageUrls) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return { allowed: false, reasons: ['No images provided'] }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Fail-open if key missing
    return { allowed: true }
  }

  // Add overall timeout for the entire AI verification process
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI verification timeout')), 45000) // 45 second timeout
  })

  try {
    const verificationPromise = (async () => {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

      // Fetch image bytes and run a concise classification prompt
      const imageParts = []
      for (const url of imageUrls) {
        const res = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout for image download
        })
        // Infer mime type from content-type header
        const mime = res.headers['content-type'] || 'image/jpeg'
        imageParts.push({
          inlineData: { data: Buffer.from(res.data).toString('base64'), mimeType: mime },
        })
      }

      const prompt = `You are an AI classifier for a municipal waste management system. Analyze the uploaded images and determine if they show legitimate waste/garbage that requires collection.

CLASSIFICATION RULES:
✅ ALLOW these waste types:
- Household garbage (bags, loose trash, food waste)
- Recyclable materials (bottles, cans, paper, cardboard)
- Electronic waste (old computers, phones, appliances)
- Construction debris (wood, concrete, tiles, pipes)
- Hazardous waste (batteries, chemicals, paint cans)
- Organic waste (yard trimmings, compost materials)
- Bulk items (furniture, mattresses, large appliances)
- Litter and illegal dumping scenes
- Overflowing waste bins or dumpsters

❌ REJECT these non-waste images:
- People as the main subject (selfies, portraits, group photos)
- Clean environments with no visible waste
- Animals or pets
- Food items that are not clearly discarded waste
- Documents, screenshots, or text-heavy images
- Vehicles (unless clearly abandoned as waste)
- Buildings or architecture (unless showing waste accumulation)
- Nature scenes without waste
- Personal belongings in use (not discarded)

RESPONSE FORMAT:
Return ONLY a JSON object with these exact fields:
{
  "allowed": boolean,
  "reasons": ["specific reason 1", "specific reason 2"],
  "confidence": number (0.0 to 1.0)
}

Be strict but fair. If unsure, err on the side of allowing legitimate waste reports.`

      const result = await model.generateContent([{ text: prompt }, ...imageParts])
      const text = result.response.text()
      console.log('AI Response:', text) // Debug logging

      let parsed
      try {
        parsed = JSON.parse(text)
      } catch (parseErr) {
        console.warn('Failed to parse AI response as JSON:', text)
        // Basic fallback parsing; fail closed to be safe
        return { allowed: false, reasons: ['AI response unparseable'] }
      }

      if (typeof parsed?.allowed === 'boolean') {
        console.log('AI Decision:', parsed)
        return {
          allowed: parsed.allowed,
          reasons: Array.isArray(parsed.reasons)
            ? parsed.reasons
            : ['No specific reasons provided'],
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        }
      }
      return { allowed: false, reasons: ['AI response format invalid'], confidence: 0.0 }
    })()

    // Race between verification and timeout
    return await Promise.race([verificationPromise, timeoutPromise])
  } catch (err) {
    // On AI errors, fail-open to avoid blocking legitimate users due to transient issues
    console.warn('[AI Verify] error:', err?.message || String(err))
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error:', err)
    }
    return { allowed: true }
  }
}

module.exports = { verifyImagesAreWaste }
