# Resource and access-type verification notes

**Review date:** 2026-11-03  
**Source policy:** Official product pages, official documentation and official project repositories are preferred. Pricing describes whether a usable free tier or free content is available, not whether every feature is free. Plans, regional availability and usage limits can change.

The `lastVerified` field in `resources.json` is a point-in-time review date, not a guarantee that a provider will keep the same features or price. Recheck the official source before relying on a specific plan or capability.

## Access-type definitions

- `browser`: the main resource is usable in a web browser. Downloading content from it (for example, an ebook) does not change this classification.
- `download`: the main experience requires software to be installed or run outside the browser.
- `both`: there is meaningful browser functionality and the provider also offers an installable app or tool that supports a useful workflow.

This field is separate from `platforms`. The platforms field lists browser/operating-system availability; the access type describes whether an installed app or tool is needed or offered.

## AI

| Resource | Access type | Verification basis |
|---|---|---|
| ChatGPT | `both` | Browser service plus official desktop and mobile downloads. [Official downloads](https://chatgpt.com/download/) |
| Claude | `both` | Browser service plus official desktop and mobile apps. [Official downloads](https://claude.com/download) |
| Gemini | `both` | Browser service and official mobile app. [Official Gemini site](https://gemini.google.com/) |
| Perplexity | `both` | Browser service and official mobile apps. [Official site](https://www.perplexity.ai/) |
| NotebookLM | `both` | Browser notebooks plus official mobile app availability. [Official NotebookLM](https://notebooklm.google.com/) |
| Hugging Face | `browser` | The Hub and Spaces are used through the website; local libraries and model downloads are separate developer workflows. [Official Hub](https://huggingface.co/) |
| Ollama | `download` | The core local model runner is installed on the user's computer. [Official download page](https://ollama.com/download) |

## Developer

| Resource | Access type | Verification basis |
|---|---|---|
| GitHub | `both` | Browser-hosted repositories plus GitHub Desktop and command-line tooling. [Official GitHub Desktop](https://desktop.github.com/) |
| Visual Studio Code | `both` | Browser-based VS Code for the Web plus the installed desktop editor. [Official VS Code for the Web](https://vscode.dev/) |
| MDN Web Docs | `browser` | Documentation and learning material are read in the browser. [Official MDN](https://developer.mozilla.org/) |
| CodePen | `browser` | The editor and preview experience run in the browser. [Official CodePen](https://codepen.io/) |
| StackBlitz | `browser` | Its online development environment runs in the browser. [Official StackBlitz](https://stackblitz.com/) |
| Vercel | `both` | Web dashboard and deployments, plus an installable command-line interface. [Official CLI docs](https://vercel.com/docs/cli) |
| Netlify | `both` | Web dashboard and deployments, plus an installable command-line interface. [Official CLI docs](https://docs.netlify.com/cli/get-started/) |

## Cybersecurity

| Resource | Access type | Verification basis |
|---|---|---|
| PortSwigger Web Security Academy | `both` | Lessons and labs are browser-accessible; many practical workflows use the separately installed Burp Suite tools. [Academy](https://portswigger.net/web-security) · [Burp setup](https://portswigger.net/burp/documentation/desktop/getting-started) |
| TryHackMe | `both` | Browser-based rooms and AttackBox are available, while some paths use installed VPN or local tools. [Official site](https://tryhackme.com/) |
| OverTheWire | `download` | Wargames are played through SSH/terminal access rather than a browser-based challenge interface. [Official wargames](https://overthewire.org/wargames/) |
| picoCTF | `browser` | The platform and practice challenges are accessed through the browser; optional local tools are not required for the main platform. [Official picoCTF](https://picoctf.org/) |
| OWASP Juice Shop | `download` | The training application is normally run as a local or hosted application using its install/deployment instructions. [Project documentation](https://owasp.org/www-project-juice-shop/) |
| CyberChef | `browser` | The primary interface is a client-side browser application. [Official project](https://gchq.github.io/CyberChef/) |

## Study & Learning

| Resource | Access type | Verification basis |
|---|---|---|
| Khan Academy | `both` | Browser learning platform plus official mobile applications. [Official site](https://www.khanacademy.org/) |
| freeCodeCamp | `browser` | Lessons and coding challenges are primarily completed through the website. [Official site](https://www.freecodecamp.org/) |
| MIT OpenCourseWare | `browser` | Course materials are browsed online; downloadable PDFs/media are content, not an installed MIT OCW application. [Official site](https://ocw.mit.edu/) |
| CS50x | `browser` | Course instructions, lectures and submissions are accessed online; optional local development tools do not change the course's main access mode. [Official course](https://cs50.harvard.edu/x/) |
| W3Schools | `browser` | Tutorials and browser-based examples are available on the website. [Official site](https://www.w3schools.com/) |
| Desmos Graphing Calculator | `both` | Interactive browser calculator plus official mobile applications. [Official calculator](https://www.desmos.com/calculator) |
| Pomofocus | `browser` | The timer and task workflow are used directly on the website. [Official site](https://pomofocus.io/) |

## Fun & Entertainment

| Resource | Access type | Verification basis |
|---|---|---|
| Radio Garden | `both` | Interactive browser globe plus official mobile apps. [Official site](https://radio.garden/) |
| Internet Archive | `browser` | The library is browsed online; downloadable books/media are content, not an installed Archive application. [Official site](https://archive.org/) |
| Project Gutenberg | `browser` | Books can be read online or downloaded as files; no installation is needed for the main library. [Official site](https://www.gutenberg.org/) |
| Neal.fun | `browser` | Interactive experiments run directly in the browser. [Official site](https://neal.fun/) |
| itch.io | `both` | Browser-based store and community plus downloadable games and the optional app. [Official site](https://itch.io/) |
| A Soft Murmur | `browser` | The sound mixer is available through the website. [Official site](https://asoftmurmur.com/) |
| myNoise | `both` | Browser sound generators and official mobile apps. [Official site](https://mynoise.net/) |
| Lofi Girl | `browser` | The curated radio/live streams are available through the website. [Official site](https://www.lofigirl.com/) |

## Interpretation notes

- `free` means the listed core experience is available without a paid subscription. It does not mean every feature, item, certificate, app or associated service is free.
- `freemium` means there is a usable free tier or free content alongside paid upgrades, limits or content.
- `openSource: true` is used only when the relevant project has a public source repository and an identified open-source licence. A free website is not automatically open source.
- Some resources offer optional installed tools that are not required for their main browser workflow. The access type reflects the meaningful use described above, not every possible integration.
- Official product details and access options can change. Recheck the provider's page before making decisions based on current pricing or availability.
