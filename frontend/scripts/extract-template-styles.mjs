/**
 * Copies the inline <style> blocks of the original Django templates into
 * per-page CSS files under src/views/styles/pages/, scoped to a page wrapper
 * class so pages don't leak global selectors (body, h1, a, *) into each other.
 *
 *   body / html / :root  ->  .page-x
 *   *                    ->  .page-x, .page-x *
 *   anything else        ->  .page-x <selector>
 *   @keyframes name      ->  @keyframes page-x-name
 *
 * Run with: npm run extract-styles
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(here, '../../myapp/templates');
const outDir = path.resolve(here, '../src/views/styles/pages');

// template file -> page class. `bodyMargin` keeps the browser's default 8px
// body margin for templates that never reset it.
const PAGES = [
  { template: 'home.html', page: 'page-home' },
  { template: 'registration_choose.html', page: 'page-registration-choose' },
  { template: 'employer_signup.html', page: 'page-employer-signup' },
  { template: 'candidate_signup.html', page: 'page-candidate-signup' },
  { template: 'login_choice.html', page: 'page-login-choice' },
  { template: 'login_employer.html', page: 'page-login-employer' },
  { template: 'login_candidate.html', page: 'page-login-candidate' },
  { template: 'password_reset.html', page: 'page-password-reset', bodyMargin: true },
  { template: 'password_reset_done.html', page: 'page-password-reset-done' },
  { template: 'job_list.html', page: 'page-job-list' },
  { template: 'total_jobs.html', page: 'page-total-jobs' },
  { template: 'post_job.html', page: 'page-post-job' },
  { template: 'apply_form.html', page: 'page-apply-form' },
  { template: 'application_submitted.html', page: 'page-application-submitted' },
  { template: 'application_success.html', page: 'page-application-success', bodyMargin: true },
  { template: 'apply_success.html', page: 'page-apply-success' },
  { template: 'browse_candidates.html', page: 'page-browse-candidates' },
  { template: 'candidate_detail.html', page: 'page-candidate-detail' },
];

const ROOT_SELECTOR = /^(html|body|:root)(?=$|[\s.:#[>+~])/;

function extractStyles(html) {
  const live = html
    .replace(/{%\s*comment\s*%}[\s\S]*?{%\s*endcomment\s*%}/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  return [...live.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
}

function scopeSelector(selector, page) {
  const sel = selector.trim();
  if (sel === '*') return [`.${page}`, `.${page} *`];
  if (ROOT_SELECTOR.test(sel)) return [sel.replace(ROOT_SELECTOR, `.${page}`)];
  return [`.${page} ${sel}`];
}

function scopeCss(css, page) {
  const root = postcss.parse(css);
  const keyframes = new Map();

  root.walkAtRules(/keyframes$/, (rule) => {
    const renamed = `${page}-${rule.params}`;
    keyframes.set(rule.params, renamed);
    rule.params = renamed;
  });

  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    rule.selectors = rule.selectors.flatMap((s) => scopeSelector(s, page));
  });

  root.walkDecls(/^animation(-name)?$/, (decl) => {
    for (const [from, to] of keyframes) {
      decl.value = decl.value.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
    }
  });

  return root.toString().trim();
}

fs.mkdirSync(outDir, { recursive: true });

for (const { template, page, bodyMargin } of PAGES) {
  const html = fs.readFileSync(path.join(templatesDir, template), 'utf8');
  // A body with the default margin behaves like a margined block (its margins
  // collapse with the first child's); otherwise the wrapper fills the viewport
  // so the page background covers it the way a body background does.
  const wrapper = bodyMargin
    ? `.${page} {\n    margin: 8px;\n}`
    : `.${page} {\n    min-height: 100vh;\n    box-sizing: border-box;\n}`;
  const base = [`/* Generated from myapp/templates/${template} by scripts/extract-template-styles.mjs */`, wrapper];
  const scoped = scopeCss(extractStyles(html), page);
  const file = path.join(outDir, `${page.replace(/^page-/, '')}.css`);
  fs.writeFileSync(file, [...base, scoped].filter(Boolean).join('\n\n') + '\n');
  console.log(`${template} -> ${path.relative(process.cwd(), file)}`);
}
