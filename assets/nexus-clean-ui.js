/* NEXUS RNA BioSolutions — non-destructive advisory presentation layer.
 * Only wraps static informational notices in accessible <details>.
 * Never suppresses runtime errors, live statuses, invalid input messages,
 * explicit research provenance, or warnings added after initialization.
 */
(() => {
  'use strict';
  const CANDIDATES = [
    '.notice.warning', '.note.warning', '.notice.strong',
    '.notice', '.note', '.platform-note', '.tools-under',
    '.scientific-disclaimer', '.scientific-warning', '.warning-banner'
  ].join(',');
  const INFORMATIONAL = /research[\s-]*(?:stage|only|use|prototype|pilot)|not\s+(?:yet\s+)?validated|not\s+(?:a|an)\s+(?:GMP|clinical)|not\s+intended\s+for|independent\s+(?:verification|validation|qualification)|interpretation\s+limit|scientific\s+scope|experimental\s+(?:verification|validation)|prototype|illustrative\s+(?:heuristic|model)|assumes\s+complete\s+cutting|does\s+not\s+(?:model|perform|fully|provide)|not\s+(?:MAFFT|MUSCLE|Clustal|ViennaRNA)/i;
  const URGENT_START = /^(?:warning\s*:\s*)?(?:error|failed|failure|invalid|missing|required|out[ -]of[ -]range|critical|unsafe|cannot\s+process|could\s+not\s+read)\b/i;
  const SKIP_SELECTOR = 'input,textarea,select,button,canvas,svg,[role="alert"],[role="status"],[aria-live],details';
  const mounted = new WeakSet();
  function processAdvisory(element) {
    if (mounted.has(element) || element.closest('details, .nexus-clean-disclosure')) return;
    if (element.id || element.matches('[role="alert"],[role="status"],[aria-live]')) return;
    if (element.querySelector(SKIP_SELECTOR)) return;
    const message = (element.textContent || '').replace(/\s+/g, ' ').trim();
    if (message.length < 25 || message.length > 1400) return;
    if (URGENT_START.test(message)) return;
    if (!element.matches('.warning') && !INFORMATIONAL.test(message)) return;
    // Do not fold prominent synthetic/example provenance into an invisible state.
    if (/^(?:SYNTHETIC\s+DEMO|DEMONSTRATION\s+ONLY|PATIENT\s+SAFETY)/i.test(message)) return;
    const details = document.createElement('details');
    details.className = 'nexus-clean-disclosure';
    details.dataset.nexusAdvisory = 'static';
    const summary = document.createElement('summary');
    summary.textContent = 'Methods & limitations';
    summary.setAttribute('aria-label', 'Show methods and limitations');
    const body = document.createElement('div');
    body.className = 'nexus-clean-disclosure-body';
    element.parentNode.insertBefore(details, element);
    details.append(summary, body);
    body.appendChild(element);
    element.classList.add('nexus-clean-original');
    mounted.add(element);
  }
  function init() {
    try {
      document.querySelectorAll(CANDIDATES).forEach(processAdvisory);
      document.documentElement.classList.add('nexus-clean-ui-ready');
    } catch (err) {
      // Do not interfere with a host scientific tool if the presentation fails.
      console.warn('NEXUS clean presentation enhancement skipped:', err);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
