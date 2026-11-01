# Level set candidates

Status: **no third-party level set is bundled yet.** The built-in levels in
`src/levels/builtin.ts` are original placeholders. Findings below come from a quick web
search (Nov 2026) and are **not legal advice**; none of them replaces confirming terms
with the original author.

## Candidates

| Set                                                                                       | Author                                          | What we found                                                                                                                                                                                                                                                                                           | Verdict                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Microban, Sasquatch I–VII, Mas Microban                                                   | David W. Skinner                                | SokoSolve lists them as "Permission Granted", licence field "author acknowledgement". KDE Skladnik and Rocks'n'Diamonds also ship them with credit. No written open licence found.                                                                                                                      | Best quality for a beginner start, but **ask Skinner for explicit written permission** to bundle in an open-source repo before use.                                             |
| "Default 90 levels" in David Joffe's `sokoban-1`                                          | Assembled from various sources                  | README says "The default 90 levels are public domain", but the original authors are not named. These resemble the classic 90-level set from Thinking Rabbit, so the claim cannot be verified.                                                                                                           | **Do not use** unless provenance is established.                                                                                                                                |
| Original Thinking Rabbit puzzles                                                          | Thinking Rabbit, Inc                            | SokoSolve marks the licence "Unknown".                                                                                                                                                                                                                                                                  | **Do not use.**                                                                                                                                                                 |
| Lee J Haywood sets (SokEvo, SokHard, ...) / Evgeny Grigoriev (GRIGoRusha)                 | individual authors                              | Copyright claims, no licence found.                                                                                                                                                                                                                                                                     | Contact authors if wanted; otherwise skip.                                                                                                                                      |
| `levels` file in [morenod/sokoban](https://github.com/morenod/sokoban/blob/master/levels) | Unknown (repo owner `morenod`)                  | One text file, 52 levels, plain XSB format with `Level N` headers. Repo is MIT-licensed, but the file has no author, source or credit lines, and the repo does not say where the levels came from. The set looks like a compilation of mixed styles.                                                    | **Do not use.** MIT covers the repo owner's own work; it can't license levels they may have copied. Provenance unknown.                                                         |
| [Alonso-del-Arte/sokoban-levels](https://github.com/Alonso-del-Arte/sokoban-levels)       | Alonso-del-Arte (self-described as the creator) | `sok` and `slc` folders; sets named Extremely Easy, Seemingly Hard, Frustratingly Difficult, Illustrative (also on Game-Sokoban.com). README says the author made them with YASC and Notepad and credits no other level authors. Sidebar shows **GPL-3.0**; the README itself has no license statement. | **Most promising**, but GPL-3.0 conflicts with our MIT plan. Ask the author to dual-license (MIT or CC0) or grant a bundling exception. Set sizes and quality not yet reviewed. |

## Recommended path

0. Alonso-del-Arte's sets are the first thing to ask about: the author appears to have
   made them personally, so a permission or relicensing request is straightforward.
1. Ship **original levels** (written by us, MIT/CC-BY compatible) as the starter set.
2. Email David W. Skinner (contact details on his Sokoban page, linked from the
   [ticalc.org archive](https://www.ticalc.org/archives/files/authors/53/5316.html)) asking
   for permission to bundle Microban with attribution. Record the reply here.
3. Optionally support **player-imported level files** (`.txt`/`.sok` in the standard format)
   so users can load any set they own without us redistributing it.

## Sources consulted

- [SokoSolve libraries](https://sokosolve.sourceforge.net/libraries.html)
- [KDE Skladnik credits](https://docs.kde.org/trunk_kf6/en/skladnik/skladnik/credits.html)
- [David Joffe's sokoban-1](https://github.com/stahta01/sokoban-1)
- [Rocks'n'Diamonds level collection release](https://www.artsoft.org/2006/03/01/sokoban-level-collection-released/)
  (search snippet only; the host was not reachable from the session)
- [Kenney Sokoban tiles (CC0)](https://opengameart.org/content/sokoban-100-tiles), for art
