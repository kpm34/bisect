/**
 * AI Vision Fallback for Selection Detection
 *
 * When event-based selection tracking fails, this module:
 * 1. Captures a screenshot of the Spline editor
 * 2. Generates a UI accessibility map
 * 3. Sends to AI (GPT-4 Vision) with RAG context
 * 4. AI identifies the selected object from visual cues
 */

export interface AIVisionResult {
    selectedObjectName?: string;
    selectedObjectUUID?: string;
    confidence: number;
    method: 'ai-vision';
    reasoning: string;
    timestamp: number;
}

export interface UIAccessibilityMap {
    elements: Array<{
        role: string;
        name: string;
        bounds: { x: number; y: number; width: number; height: number };
        selected?: boolean;
        highlighted?: boolean;
    }>;
    screenshot: string; // base64
}

/**
 * Capture screenshot and UI map
 */
export async function captureUIContext(): Promise<UIAccessibilityMap> {
    // Get accessibility tree
    const elements: any[] = [];

    // Traverse DOM for UI elements
    const traverse = (node: Element, depth = 0) => {
        if (depth > 10) return; // Limit depth

        const rect = node.getBoundingClientRect();
        const role = node.getAttribute('role') || node.tagName.toLowerCase();
        const name = node.getAttribute('aria-label') ||
                    node.getAttribute('title') ||
                    (node as HTMLElement).innerText?.substring(0, 50) ||
                    '';

        // Check if element appears selected (has certain classes/styles)
        const classList = Array.from(node.classList);
        const selected = classList.some(c =>
            c.includes('selected') ||
            c.includes('active') ||
            c.includes('highlighted')
        );

        if (rect.width > 0 && rect.height > 0 && name) {
            elements.push({
                role,
                name,
                bounds: {
                    x: Math.round(rect.x),
                    y: Math.round(rect.y),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                },
                selected,
                highlighted: window.getComputedStyle(node).backgroundColor !== 'rgba(0, 0, 0, 0)'
            });
        }

        Array.from(node.children).forEach(child => traverse(child, depth + 1));
    };

    // Start from Spline UI container
    const splineContainer = document.querySelector('[role="application"]') || document.body;
    traverse(splineContainer as Element);

    // Capture screenshot
    const screenshot = await captureScreenshot();

    return {
        elements,
        screenshot
    };
}

/**
 * Capture screenshot as base64
 */
async function captureScreenshot(): Promise<string> {
    try {
        // Use chrome.tabs.captureVisibleTab if available (from background script)
        // For now, return empty string - will be captured by background script
        return '';
    } catch (error) {
        console.error('[AI Vision] Screenshot capture failed:', error);
        return '';
    }
}

/**
 * Analyze UI with AI Vision + RAG
 */
export async function analyzeSelectionWithAI(
    uiMap: UIAccessibilityMap,
    ragContext: string[]
): Promise<AIVisionResult> {
    const prompt = `
You are analyzing a Spline 3D editor interface to identify which object is currently selected.

## UI Accessibility Map
${JSON.stringify(uiMap.elements, null, 2)}

## RAG Context (Previous Selections)
${ragContext.join('\n')}

## Task
Analyze the UI elements and screenshot to determine:
1. Which object name appears in a "selected" or "highlighted" state?
2. Look for visual cues like:
   - Blue/purple highlighting in the left sidebar
   - Active/selected CSS classes
   - Different background colors
   - Bold or emphasized text

## Response Format
Return JSON with:
{
  "selectedObjectName": "exact object name",
  "confidence": 0.0-1.0,
  "reasoning": "why you believe this object is selected"
}
`;

    try {
        // Call OpenAI GPT-4 Vision API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getOpenAIKey()}`
            },
            body: JSON.stringify({
                model: 'gpt-4-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/png;base64,${uiMap.screenshot}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            })
        });

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        return {
            selectedObjectName: result.selectedObjectName,
            confidence: result.confidence,
            method: 'ai-vision',
            reasoning: result.reasoning,
            timestamp: Date.now()
        };
    } catch (error: any) {
        console.error('[AI Vision] Analysis failed:', error);
        return {
            confidence: 0,
            method: 'ai-vision',
            reasoning: `Error: ${error.message}`,
            timestamp: Date.now()
        };
    }
}

/**
 * Get OpenAI API key from chrome.storage
 */
async function getOpenAIKey(): Promise<string> {
    // This will be called from background script context
    // where we have access to stored API key
    return '';
}

/**
 * Main fallback function: Try AI vision if event tracking fails
 */
export async function detectSelectionWithAIFallback(
    ragContext: string[] = []
): Promise<AIVisionResult | null> {
    console.log('[AI Vision] Attempting AI-powered selection detection...');

    try {
        // Step 1: Capture UI context
        const uiMap = await captureUIContext();

        // Step 2: Analyze with AI + RAG
        const result = await analyzeSelectionWithAI(uiMap, ragContext);

        console.log('[AI Vision] Analysis result:', result);

        // Step 3: Store in RAG for future reference
        if (result.confidence > 0.7) {
            await storeInRAG(result);
        }

        return result;
    } catch (error) {
        console.error('[AI Vision] Fallback failed:', error);
        return null;
    }
}

/**
 * Store successful detection in RAG for future reference
 */
async function storeInRAG(result: AIVisionResult): Promise<void> {
    // TODO: Implement ChromaDB storage
    console.log('[AI Vision] Storing in RAG:', result);
}
