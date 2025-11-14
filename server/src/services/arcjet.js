// Arcjet initialization for server-side email validation during signup
// Fails open if ARCJET_KEY is not configured

let aj

try {
  const arcjetNode = require('@arcjet/node')
  const arcjet = arcjetNode && arcjetNode.default ? arcjetNode.default : arcjetNode
  const { validateEmail } = arcjetNode

  if (process.env.ARCJET_KEY) {
    aj = arcjet({
      key: process.env.ARCJET_KEY,
      rules: [
        validateEmail({
          mode: 'LIVE',
          // Deny disposable emails and obviously invalid or non-routable emails
          // You asked specifically to block disposable emails
          deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
        }),
      ],
    })
  } else {
    console.warn('[Arcjet] ARCJET_KEY not set. Email validation will be skipped (fail-open).')
  }
} catch (err) {
  console.warn(
    '[Arcjet] Failed to initialize. Email validation will be skipped (fail-open).',
    err && err.message ? err.message : err
  )
}

module.exports = { aj }
