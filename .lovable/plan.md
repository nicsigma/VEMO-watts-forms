
Build a bilingual-in-data but Spanish-language user testing app for Vemo with two clearly separated experiences: a mobile-first participant flow at `/` and a desktop-first moderator area at `/moderator`.

1. Participant flow
- Replace the placeholder homepage with a focused “Pantalla 0” intake screen used at the start of every exercise.
- Collect and save on every new submission: alias, age range, vehicle type, primary use, charging frequency at Vemo, months using Vemo, session of the day, focus group, and exercise to perform.
- Make the exercise dropdown dynamic:
  - Activation Fee sessions → Ticket A / Ticket B flow
  - Anchor Hubs sessions → Card sort / Photos
- Pre-fill participant fields from local storage so repeat participants can start faster, while still creating a fresh submission every time.
- Add a prominent “Iniciar ejercicio” CTA that creates a new submission and starts the selected activity.
- Show a clear top progress bar throughout exercises, with large touch-friendly buttons and inputs for tablet use.

2. Exercise 1: Ticket A/B
- Create a 4-step guided experience:
  - Paso 1: Ticket A image + “¿Qué estás viendo?”
  - Paso 2: Ticket B image + “¿Qué estás viendo?”
  - Paso 3: both tickets side by side + 3 A/B comparisons (clearer, fairer, willing to pay) + “¿Por qué?”
  - Paso 4: explanation text + A/B/Igual choice for permanent preference + “¿Por qué?”
- Add clear image replacement slots for the two uploaded ticket assets.
- Save answers progressively so the moderator can see live responses and unfinished tests.

3. Exercise 2: Card sort
- Build a drag-and-rank experience with 13 placeholder cards in randomized order.
- Let the participant reorder cards from most important to least important, then confirm the final ranking.
- Keep the UI simple and tactile for tablet use, with clear numbered ranking feedback.
- Prepare the content so the 13 placeholder labels can be swapped easily with the final attribute list later.

4. Exercise 3: Photos
- Build a 3-step photo grouping exercise:
  - Paso 1: 6 draggable photos in a pool, 2 starting groups, “+ agregar grupo” up to 5 total, cannot continue until all photos are assigned
  - Paso 2: one naming + reasoning form for each created group
  - Paso 3: 6-photo grid to choose a favorite + “¿Por qué?”
- Add clean placeholder slots for the 6 hub photos so they can be replaced after upload.
- Make grouping visually obvious with clear containers, thumbnails, and validation messaging.

5. Participant completion
- End every exercise with a simple final screen:
  - “Hacer otro ejercicio” returns to Pantalla 0 with fields prefilled
  - “Terminar” closes the participant journey cleanly
- Mark submissions as completed when the final step is reached.

6. Moderator access
- Add a separate `/moderator` route outside the participant flow.
- Protect it with a single shared 4-digit PIN.
- After correct entry, remember moderator access temporarily on that device/browser for the rest of the day.
- Keep the entry experience minimal and distinct from the participant UI.

7. Moderator dashboard
- Build a live dashboard with session counters at the top, refreshing every 10 seconds.
- Show totals like completed tests per session:
  - Activation Fee - Ride Hailing
  - Activation Fee - B2C
  - Anchor Hubs - Ride Hailing
  - Anchor Hubs - B2C
- Add a submissions table with one row per test and columns for alias, session, exercise, segment, status, completed, and action.
- Add filters for session, exercise, segment, and status, plus alias search.
- Add export actions for CSV and JSON that respect current filters and include expanded response data.

8. Moderator detail view
- Open each submission in a drawer from the dashboard table.
- Show participant profile data first, then the exercise-specific response format:
  - Ticket A/B: side-by-side answer summary, A/B choices, and verbatims
  - Card sort: ordered ranking with top 3 highlighted in green and bottom 3 in gray
  - Photos: grouped thumbnails with names/reasons plus selected favorite
- Make incomplete vs completed submissions visually clear.

9. Data structure and persistence
- Use Supabase with a central `test_submissions` record for every exercise attempt, including duplicated participant metadata on each row as requested.
- Store exercise-specific answers in separate child records linked 1:1 to each submission.
- Track started, in-progress, and completed states so moderators can monitor live activity and exports remain structured.

10. Design system
- Apply a clean Notion/Linear-inspired interface using:
  - Primary teal `#147F6E`
  - Dark teal `#0E5B50`
  - Amber accent `#E89214`
  - Navy text `#0E2A47`
- Participant side: mobile-first, large controls, reduced clutter, clear step progression.
- Moderator side: desktop-first, denser data layout, filters, drawer details, and export controls.
- Use image placeholders with obvious labels so your uploaded ticket and hub assets can be dropped in without redesign.

11. v1 scope boundaries
- Build the complete participant flow, moderator PIN gate, dashboard, detail drawer, and exports.
- Skip the optional synthesis page for now.
- Use placeholder card-sort content first, ready for your final 13-card list in the next iteration.
