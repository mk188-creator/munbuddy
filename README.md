# MUN AI Assistant

Build a production-ready full-stack AI web application called **MUN Buddy**, a premium AI assistant for Model United Nations. The app must be modern, fast, secure, responsive, scalable, and fully functional.



### Tech Stack

- Next.js, React, TypeScript, Tailwind CSS

- Supabase (Auth, PostgreSQL, Storage)

- Netlify deployment ready

- Clean modular architecture

- Environment variables for secrets



### Design

- Premium UI inspired by ChatGPT's clean design (without copying OpenAI branding or assets).

- Dark mode by default.

- Left sidebar.

- Beautiful dashboard.

- Smooth animations.

- Responsive on desktop, tablet, and mobile.

- Fast loading with consistent design.



### Authentication & Profile

- Email/Password + Google Login

- Forgot Password

- Persistent login

- Secure authentication

- Editable profile

- Full Name, School, Country, Bio, MUN Experience

- Upload profile picture from phone/computer gallery after login.

- Support JPG, PNG & WebP.

- Crop, resize, optimize and store images in Supabase Storage.

- Display profile picture throughout the app.

- Allow changing/removing profile picture anytime.



### Dashboard

- AI Chat

- Recent Chats

- Saved Documents

- Search

- AI Usage

- Quick Actions



### AI Features

- AI Chat

- Country Stance Finder

- Position Paper

- Resolution

- Working Paper

- Clause Generator

- Amendment Generator

- POI Generator

- Motion Suggestions

- Speech Generator (30/60/90 sec)

- Opening & Closing Speeches

- Debate & Caucus Strategy

- Crisis Committee Assistant

- Country Profile

- Committee Background Guide

- Research Assistant

- Fact Checker

- UN Resolution Assistant



### Documents

- Rich Text Editor

- Auto Save

- Create/Edit/Delete

- Duplicate

- Search

- Folder Organization

- Export PDF, DOCX & TXT



### AI

- Use Google's Gemini Free API by default.

- Automatically fall back to another free model if unavailable.

- Stream responses.

- Fast response speed.

- Modular AI provider for future upgrades.



### About MUN

Create a beautiful page explaining:

- What is MUN

- History

- Benefits

- University & Portfolio advantages

- Leadership

- Public Speaking

- Diplomacy

- Negotiation

- Research

- Committee Types

- Conference Structure

- Common MUN Terms

- Beginner Guide

- FAQ

- Official UN Resources



### Meet the Creator

Create a premium page.



Name: **M. Mustafa Khan**



Title: **Founder & Creator of MUN Buddy**



Vision:

To make Model United Nations accessible to everyone using AI while helping students improve research, diplomacy, leadership, public speaking, negotiation, and confidence.



Mission:

Empower future leaders through innovative AI tools that simplify MUN preparation without replacing learning.



Contact:

- Email: **mk0690188@gmail.com** (clickable mailto link)

- Instagram: **@M_Mustafa_khans** (clickable link to Instagram)



### Settings

- Edit Profile

- Change Password

- Notifications

- Theme

- Privacy

- Delete Account



### Architecture

- Every page and tab must have a unique UI and unique functionality.

- Never duplicate pages.

- Every navigation item must open a real working page.

- Connect everything using one backend, one database, and one authentication system.

- Reuse common UI components only.



### Quality

- No placeholders.

- No fake functionality.

- Every button, form, setting and feature must work.

- Authentication must persist.

- Documents and search must work correctly.

- Proper loading states, validation and error handling.

- No runtime, TypeScript, ESLint or console errors.

- No broken links or TODOs.



### Netlify

- Configure redirects correctly.

- Ensure routing works after refresh.

- Configure environment variables.

- Build successfully without manual fixes.

- Optimize performance.



### Branding

- Premium logo combining a globe and speech bubble.

- Include favicon.



### Final Requirement

Automatically test every page, button, form, API, AI feature, navigation, profile, settings, documents, authentication and Netlify deployment. Detect and fix all issues before completion. The final product must feel like a polished commercial SaaS application with every feature fully working.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fc24e750-1fe2-4acb-971d-bd8feff847e6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
