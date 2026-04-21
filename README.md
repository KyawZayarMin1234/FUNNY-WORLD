# README.md

Project: Fun Game Hub (HTML, CSS, Vanilla JS only). Deploy on GitHub Pages.

Goals
- Provide 4 tabs with 8 games total: 2 Game, 4 Pixel, 1 Story (4 stories), 1 Shopping.
- Site has 5 pages: Home page plus 4 tab pages (Game, Pixel Game, Story Game, Elon Money).
- Entertainment, brain training, and fun for all ages.

Constraints
- Use only HTML, CSS, and Vanilla JavaScript. No frameworks.
- Each tab is a separate HTML page (multi-page site, not a single-page app).
- Use Canvas API for the runner and ball catch games.
- Use DOM manipulation for puzzle games.
- Keep a consistent header and footer and the same tab navigation across pages.
- Provide a back-to-top button on each page.

Tabs and Games
1. Game Tab (2 games)
   - Endless Runner: player runs/jumps/ducks, obstacles appear, score increases over time, game over on collision.
   - Ball Catch Game: ball falls from top, paddle moves left and right, catch to score, speed increases each catch, miss ends game.
2. Pixel Game Tab (4 games)
   - Sudoku: 9x9 grid, some pre-filled cells, input numbers, validate rows/columns/boxes, check button, new game.
   - Memory Match: 4x4 grid (16 cards, 8 pairs), flip cards, match pairs, win when all matched, timer and move counter.
   - Pixel Puzzle (Jigsaw): image split into 4x4 pieces, shuffled, click to swap, complete to win, hint button.
   - Tic Tac Toe: 3x3 grid, player vs computer or two players, win/draw detection, reset.
3. Acting Story Game Tab (1 game, 4 stories)
   - Characters: Ghost Guardian, Student, Warrior, Detective.
   - Story text appears in animated boxes.
   - 2-3 choices per step; choices branch to different scenes and endings.
   - Images appear beside story boxes.
   - Replay option.
4. Spend Elon Musk Money Tab (Shopping Game)
   - Start money: 200,000,000,000.
   - Item shop grid; click to purchase; money updates immediately.
   - Item disappears after purchase (limited stock).
   - Shopping cart shows purchased items and total spent.
   - Humor text such as Can Elon afford this.

Item List and Prices
- Tesla Car: 100,000
- Private Jet: 50,000,000
- Mansion: 5,000,000
- Gold Gun: 500,000
- Private Island: 10,000,000
- SpaceX Rocket: 60,000,000
- Football Team: 2,000,000,000
- Luxury Watch: 1,000,000
- Vineyard: 500,000,000
- YouTube Company: 10,000,000,000

Navigation and Layout
- Top navigation bar links to Home plus 4 separate tab pages.
- Each tab page shows its games below.
- Consistent header and footer across all pages.
- Back to top button on each page.

UI Sketch Notes
- Clean layout for easy scanning.
- Scores visible during gameplay.
- Shopping cart visible with purchase history and total spent.
- Consistent styling across tabs.

Implementation Plan
- Week 1: repo setup, HTML structure, CSS styling, basic site skeleton with 4 tabs.
- Week 2: Tic Tac Toe and Memory Match.
- Week 3: Ball Catch game and start Endless Runner.
- Week 4: Finish Endless Runner and Pixel Puzzle.
- Week 5: Sudoku (basic).
- Week 6: Acting Story game structure and 2 stories.
- Week 7: Elon Musk Money game and remaining stories.
- Week 8: Testing, bug fixes, polish.
- Week 9: Report and screencast.

Risk Management
- If behind schedule, simplify Sudoku (remove validation first).
- If far behind, focus on 1-2 games per tab.
- Always keep a working version.

Technologies
- HTML5 for structure.
- CSS3 for styling, animations, responsive design.
- Vanilla JavaScript for all game logic.
- Canvas API for runner and ball catch graphics.
- LocalStorage optional for game progress or high scores.
- GitHub Pages for hosting.

Technical Challenges and Solutions
- Runner obstacle collision detection: bounding box collision.
- Sudoku validation: check rows, columns, and 3x3 boxes separately.
- Memory Match flip: toggle CSS classes on click.
- Story branching: object-based story structure.
- Responsive design: CSS Grid and Flexbox.
- Game state: JavaScript objects for scores and progress.

Additional Features (Optional)
- Animations: falling boxes in story game, card flip effects.
- Sound effects for action games and purchases.
- Dark mode toggle.
- LocalStorage for progress and high scores.

