/**
 * Determines which "world" the code is running in.
 *
 * @returns 'Main' for main process, 'Renderer' for renderer process, 'ContextBridge' for preload scripts
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
