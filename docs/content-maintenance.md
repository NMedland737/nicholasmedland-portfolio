# Content maintenance

This is a quick map for routine portfolio updates.

## Projects

Project text and media lists are in `app/page.tsx` near the top of the file. Each project has an `id`, category, year, description, tags, challenge, learning note, and media list.

Web-ready media belongs in `public/projects/<project-name>/`. Paths used in the project list start at `/projects/`; for example:

```text
/projects/card-shuffler/assembled.png
```

Keep original, full-resolution source media outside this repository in the desktop `project-assets` folder. Only optimized files needed by the website belong in `public`.

## Work history

Résumé-page jobs are in the `experience` list in `app/resume/page.tsx`. Keep entries in reverse chronological order.

## Downloadable résumé

Replace `public/Nicholas-Medland-Resume.pdf` with the new one-page PDF and keep the filename unchanged so existing links continue to work.

## Sudoku

The playable game is in `app/games/sudoku-game.tsx`. The preserved high-school Java source shown in the algorithm pop-up is `public/games/Nicholas-SudokuGame.java.txt`.

## Before publishing

1. Run `npm run build`.
2. Check the homepage, `/resume`, and `/games` at desktop and narrow mobile widths.
3. If an API file changed, test the related printer workflow before deploying.
4. Commit and push the exact source that was built.
