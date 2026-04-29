# Project Blueprint: Spring Days - A Digital Love Letter

## 1. Project Overview
**Goal:** Build a highly personalized, 3D interactive web experience as a birthday gift. The app will transition through seasons (Winter/Rain to Spring/Cherry Blossoms) to tell a relationship story, acting as a digital love letter.
**Pacing:** This is a rapid-development MVP. Code should be modular, heavily relying on established libraries, and prioritized for visual impact and smooth performance over complex backend logic.

## 2. The Subject Context (Crucial for Tone & Content)
*All generated copy, UI elements, and interactions must align with these traits:*
* **Background:** Muslim, from Bangladesh, recently completed a BA in English. The tone should be poetic, romantic, and culturally respectful.
* **Interests:** BTS (specifically Jung Kook), nature (rainy seasons, cherry blossoms), traveling (Japan, South Korea, Paris, Switzerland).
* **Favorite Treats:** Hershey's Cookies N Cream White, Kinder Joy, Kinder Bueno, Ferrero Rocher.
* **Emotional Goal:** She struggles with insecurities regarding acne/pimples. The narrative and embedded affirmations should gently reassure her of her beauty (inner and outer) without explicitly mentioning the medical condition. Think metaphors: "Like the rain clears the dust, we'll clear the clouds together."

## 3. Architecture & Tech Stack
* **Framework:** Next.js 16 (App Router) with React 19 and TypeScript.
* **Styling:** Tailwind CSS.
* **3D Environment:** Three.js + React Three Fiber (R3F) (For rain and cherry blossom particle systems).
* **Animations:** GSAP + ScrollTrigger (For scroll-linked storytelling), Framer Motion (For UI transitions).
* **Audio:** Web Audio API (For Jung Kook instrumental background, handling mobile autoplay policies).
* **State Management:** Zustand (To track the current "season" and scroll progress).
* **Deployment:** Vercel.

## 4. Core Experience Flow
1.  **Landing / Intro:** A moody, beautiful rainy scene (Three.js particles). Audio fades in. 
2.  **The Journey (Scroll):** As the user scrolls, GSAP triggers poetic text blocks (drawing on English literature themes and BTS's "Spring Day" metaphors).
3.  **The Transition:** The rain slows down, lighting warms up, and the environment transitions to Spring.
4.  **The Bloom:** Cherry blossoms replace the rain. Interactive elements appear (e.g., clicking blossoms to reveal affirmations or favorite travel destinations).
5.  **The Conclusion:** A final personalized birthday message.

## 5. Rapid Implementation Plan

### Phase 1: Environment & Engine
* Initialize Next.js 16 + Tailwind + R3F.
* Build the base 3D Canvas.
* Create the Rain Particle System (Winter).
* Create the Cherry Blossom Particle System (Spring).
* *Outcome:* A working 3D scene where we can manually toggle between rain and blossoms.

### Phase 2: Audio & State
* Integrate Web Audio API with a play/pause toggle (required for browser autoplay rules).
* Set up Zustand store to track scroll depth and current season state.
* *Outcome:* Music plays, and the 3D environment reacts to state changes.

### Phase 3: GSAP Storytelling
* Implement ScrollTrigger.
* Create transparent HTML overlays for the poetic text blocks.
* Tie the ScrollTrigger progress to the 3D environment transition (Rain -> Blossoms).
* *Outcome:* Scrolling down the page organically transitions the weather and fades text in/out.

### Phase 4: Polish & Deploy
* Add micro-interactions (Framer Motion) for UI elements.
* Embed subtle Easter eggs (chocolates, travel locations).
* Mobile responsive check (ensure 3D canvas scales properly on phones).
* Deploy to Vercel and test audio on mobile browsers.
* *Outcome:* Final, live production build.