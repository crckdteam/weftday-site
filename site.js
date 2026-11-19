// The little the website does by itself: plays its clip only while it is in view (and never by itself for
// someone who has asked for less motion), and marks the tab of the card being read.
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const clip = document.getElementById('tour'), button = document.getElementById('tourBtn'), still = document.getElementById('tourStill');
if (clip && button) {
  const cuts = [...clip.querySelectorAll('source')];   // the phone cut carries a media rule, the wide cut does not
  const narrow = matchMedia(cuts.find(cut => cut.media)?.media || '(max-width: 600px)');
  // the still under the clip is its first frame: the wide one is the picture itself, the phone one is offered beside it
  const stills = { wide: still?.getAttribute('src'), phone: still?.parentElement.querySelector('source')?.getAttribute('srcset') };
  let wanted = !calm;   // whether the visitor wants it playing
  let seen = false;     // whether it is on screen
  const show = () => { button.setAttribute('aria-pressed', String(!clip.paused)); button.setAttribute('aria-label', clip.paused ? 'Play the clip' : 'Pause the clip'); };
  const run = () => { if (seen && wanted) clip.play().catch(() => {}); else clip.pause(); };
  // Only the cuts that suit this screen are left for the browser to choose from, and the matching still is named as
  // the clip's poster. The browser has usually picked the right cut already, from the rule written beside the phone
  // cut. It is asked to pick again only if it has not, or if the screen has changed, because asking makes some
  // browsers fetch the clip at once. Left alone, nothing of the clip is fetched until it is first played.
  const choose = () => {
    const phone = narrow.matches, fit = cuts.filter(cut => !cut.media || phone);
    if (fit.length !== clip.children.length) clip.replaceChildren(...fit);
    const first = phone ? stills.phone || stills.wide : stills.wide;
    if (first) clip.poster = first;
    clip.width = phone ? 1080 : 1920; clip.height = phone ? 1350 : 1080;
    const picked = cuts.find(cut => cut.src === clip.currentSrc);
    if (picked && !!picked.media !== phone) clip.load();
    show(); run();
  };
  button.addEventListener('click', () => { wanted = clip.paused; run(); });
  clip.addEventListener('play', show);
  clip.addEventListener('pause', show);
  narrow.addEventListener('change', choose);
  new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; run(); }, { threshold: 0.35 }).observe(clip);
  button.hidden = false;
  choose();
}

const row = document.querySelector('.tabs');
if (row) {
  const tabs = new Map([...row.querySelectorAll('a')].map(a => [a.dataset.tab, a]));
  const slide = left => { if (row.scrollWidth > row.clientWidth) row.scrollTo({ left, behavior: calm ? 'auto' : 'smooth' }); };
  const reading = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const tab = tabs.get(entry.target.id);
      if (!tab) continue;
      tab.classList.toggle('on', entry.isIntersecting);
      if (entry.isIntersecting) tab.setAttribute('aria-current', 'true'); else tab.removeAttribute('aria-current');
      // on a narrow screen the row of tabs scrolls sideways: bring the marked one into view
      if (entry.isIntersecting) slide(tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2);
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  for (const id of tabs.keys()) { const card = document.getElementById(id); if (card) reading.observe(card); }
  // back at the top of the page, the row starts from its first tab again
  const front = document.querySelector('.hero');
  if (front) new IntersectionObserver(([entry]) => { if (entry.isIntersecting) slide(0); }, { threshold: 0.5 }).observe(front);
}
