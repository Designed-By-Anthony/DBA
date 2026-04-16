export function initRevealAnimations(): void {
  const revealUpElements = Array.from(document.querySelectorAll<HTMLElement>('.reveal-up'));
  const revealElements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealUpElements.length === 0 && revealElements.length === 0) return;

  if (prefersReducedMotion) {
    revealUpElements.forEach((element) => element.classList.add('reveal-active'));
    revealElements.forEach((element) => element.classList.add('active'));
    return;
  }

  document.documentElement.classList.add('reveal-ready');

  window.requestAnimationFrame(() => {
    revealUpElements.forEach((element, index) => {
      window.setTimeout(() => {
        element.classList.add('reveal-active');
      }, Math.min(index, 20) * 58);
    });

    revealElements.forEach((element, index) => {
      window.setTimeout(() => {
        element.classList.add('active');
      }, Math.min(index, 10) * 70);
    });
  });
}
