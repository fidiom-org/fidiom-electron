const MOCK_RESPONSES = [
  'Based on your recent spending, your largest category this month is Food. I can help you set a budget or forecast runway if you switch to business mode.',
  'Your burn rate looks stable. Consider reviewing recurring subscriptions in the Transport category for potential savings.',
  'Runway estimates depend on current cash balance and average monthly expenses. Open the dashboard runway widget for the latest numbers.'
]

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const mockInfer = async (
  userMessage: string,
  onToken: (token: string) => void
): Promise<string> => {
  const pick =
    MOCK_RESPONSES[userMessage.length % MOCK_RESPONSES.length] ?? MOCK_RESPONSES[0]
  const words = pick.split(' ')
  let full = ''

  for (const word of words) {
    const chunk = `${word} `
    full += chunk
    onToken(chunk)
    await delay(40 + Math.random() * 60)
  }

  onToken('')
  return full.trimEnd()
}
