# Decisions queue

Questions from the B1 agent loop that need James, and his answers. The queue is a
file so it survives a closed laptop: an agent writes here and keeps working, James
answers from any machine or from his phone, the next run picks the answers up.

**Agents:** append under **Open**. Always propose a default and state what you
will do if it goes unanswered — then do that and carry on. Never wait.

**James:** answer by editing the `→` line. Move the whole block to **Answered**
when it is dealt with, or leave it and an agent will move it once applied.

Format:

```
### <unit_id> · <rule id or topic>
**Q:** one sentence.
**Options:** a / b / c
**Default if unanswered:** a — and why.
→ (James: your answer here)
```

---

## Open

### b1_past_perfect · A4 `the` in past narrative
**Q:** Seven items demand `the` where the Czech carries no demonstrative (*the film*, *the station*, *the train*, *the room*, *the door*, *the shop*, *the window*) — is that a real A4 fault at B1, or is it English forcing the article?
**Options:** a) leave them — English forces `the` on a second mention or a known referent, and stripping it would teach bad English / b) add the article-free wording to `accepts` where a native would also say it / c) rewrite the sentences onto nouns that do not need an article.
**Default if unanswered:** a — every one of the seven is a *known referent* (the film we are watching, the station we were heading for). Dropping `the` there is not English, and (b) would accept sentences no native writes. The A4 candidate stays lit on this pack; the sequencing story is that `the` is not the teaching point here, so it costs the student nothing.
→ (James: your answer here)

### B1 grammar · `vocablevel` fires on every grammar pack
**Q:** The `vocablevel` candidate ("92% of words are 2+ levels below B1 — is this really a B1 unit?") fires on b1_past_perfect and on most B1 grammar packs. Should a grammar pack be lexically levelled at all?
**Options:** a) ignore it on grammar packs — a form unit must carry easy vocabulary so the only difficulty is the form (A0: one degree of freedom) / b) raise the carrier vocabulary to B1 words / c) exempt grammar packs in `lint.py` so the signal stops firing.
**Default if unanswered:** a — carry on ignoring it on grammar packs, and do not raise carrier vocabulary. Note that (c) is the cheap version of (a) but it is a lint change, which is not this loop's to make unattended.
→ (James: your answer here)

---

## Answered

*(empty)*
