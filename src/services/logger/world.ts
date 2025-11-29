/**
 * Detects the execution context/world.
 *
 * @returns The world context: 'Main', 'Renderer', or 'ContextBridge'
 */
export function whatWorld(): 'Renderer' | 'Main' | 'ContextBridge' {
  if (typeof window === 'undefined') {
    return 'Main';
  }

  if (typeof Buffer === 'undefined') {
    return 'Renderer';
  }

  return 'ContextBridge';
}
