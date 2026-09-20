# Agent tiering policy for this repo

Four custom agents are defined here, tiered by model cost and task difficulty.
This file is the policy the orchestrating agent (whichever Claude instance is
driving the session) should follow when deciding whether to delegate at all,
and if so, to which agent.

## When to use a sub-agent at all

Only delegate to a sub-agent when it is likely to save tokens overall —
typically because the sub-task involves a lot of exploration/output that
would otherwise bloat the main conversation's context, or because it can run
in parallel with other work. For a small, well-understood edit, just make the
edit directly rather than paying the overhead of spinning up an agent.

## The tiers

| Agent | Model | Use for |
|---|---|---|
| [`quick-task`](quick-task.md) | Haiku | Small, mechanical, fully-specified work — a rename, a boilerplate file, a single-file fix at a known location. |
| [`investigator`](investigator.md) | Sonnet | Investigation/research — bug hunting, tracing flows, answering "why does X happen" or "how is Y wired" before a plan exists. Read-only. |
| [`implementer`](implementer.md) | Opus | The default for real work: moderately difficult planning and implementation, multi-file changes, new features, tests. |
| [`deep-consultant`](deep-consultant.md) | Fable | Only for the hardest, most uncertain, genuinely cross-system problems (e.g. spanning auth + payments + multi-tenant deploy at once) where getting it wrong is expensive. |

Pick the cheapest tier that can actually do the job. Escalate one tier at a
time based on evidence the current tier isn't sufficient (e.g. `investigator`
comes back saying the fix isn't obvious → `implementer`; `implementer` comes
back saying the problem is genuinely cross-system and high-stakes →
consider `deep-consultant`).

## The Fable gate (`deep-consultant`)

`deep-consultant` runs on the most expensive model tier available. It must
**never** be invoked automatically, including while operating in Auto mode.
Auto mode's bias toward not stopping for confirmation does not extend to this
decision — this is exactly the kind of call that Auto mode's own rules
reserve for a human.

Before invoking `deep-consultant`:

1. State plainly why the task needs this tier rather than `implementer`
   (Opus) — what about it is genuinely cross-system, high-uncertainty, or
   high-blast-radius that a cheaper tier already failed or is unlikely to
   handle.
2. Give a **business justification** for the upgrade: what it costs to get
   this wrong (rework, incident, security exposure, customer-facing
   deployment across the `demo`/`clubwish`/`proteus` environments), or what
   it costs in time/money to keep iterating at a cheaper tier versus solving
   it once at this tier.
3. Ask the user for explicit permission for *this specific task* — a prior
   approval to use `deep-consultant` does not carry over to a new task.
4. If the user isn't available to answer in-turn, end the turn and ask rather
   than substituting `implementer` silently or proceeding without
   permission. Don't let "Auto mode keeps going" pressure a workaround here.

## Token-minimization instructions

Each agent file bakes in output-style rules (no pleasantries, no hedging, no
restating the task, terse final reports) so that delegated work doesn't
re-introduce the verbosity these agents exist to avoid. See CLAUDE.md for the
project architecture and conventions every agent should already know before
touching this codebase.
