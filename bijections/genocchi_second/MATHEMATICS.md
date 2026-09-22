# Mathematical implementation notes

Reference: Deb–Sokal, [arXiv:2212.07232v1](https://arxiv.org/pdf/2212.07232),
§7 (printed pages 73–85), particularly §7.1–§7.3, Figure 11 (page 76), and
Lemma 7.7. The almost-Dyck/0-Schröder conversion is defined on page 51 and
recalled in §7.1.

## Objects and conventions

For N = 2n, a D-permutation σ of {1,…,N} satisfies

- σ(i) ≥ i for odd i;
- σ(i) ≤ i for even i.

The bipartite graph has a top row 1,…,N and a bottom row 1′,…,N′, with
arrows i → σ(i)′. Γᵢ is the induced graph on the first i vertices of each row.
At each stage the two rows contain the same number fᵢ of free vertices.
Free means incident to no permutation edge; the optional dotted return links
i′ → i are not permutation edges and do not change this definition.

All ranks are **zero-based**, ordered by vertex number from left to right.
Permutation values and mathematical indices are **one-based**.

## Forward map

Let p = σ⁻¹. Starting with h₀ = 0, define sᵢ to be U when p(i) is even and D
when p(i) is odd. An up step adds 1 to the height; a down step subtracts 1.

Equation (7.3):

```
ξ′ᵢ = 0                                   if p(i) is even
ξ′ᵢ = #{ j : p(j) < p(i) ≤ i < j }         if p(i) is odd
```

Equation (7.4):

```
ξ″ᵢ = 0                                   if i is odd
ξ″ᵢ = #{ j : σ(j) < σ(i) ≤ i < j }         if i is even
```

The code computes these two counts directly. It does not infer the forward
labels by running the inverse algorithm.

## Inverse map

Maintain ordered lists T and B of free top and bottom vertices from Γᵢ₋₁.
Add the new vertices i and i′ at step i. For label (a,b):

| Step | Parity of i | Connection(s) | Candidate list(s) |
| --- | --- | --- | --- |
| U | odd | None | Neither coordinate is active |
| U | even | i → B*[b]′ | B* = B followed by i |
| D | odd | T*[a] → i′ | T* = T followed by i |
| D | even | T[a] → i′ and i → B[b]′ | Old T and old B only |

Remove each newly occupied endpoint from its free list. Choosing the new
vertex itself produces a fixed point. In the last case, take both choices
from the lists before connecting either edge.

At incoming height h, the maximum allowed pair of labels is:

| Step | Incoming height | Allowed pairs |
| --- | --- | --- |
| U | 2k | (0,0) |
| U | 2k−1 | (0,b), 0 ≤ b ≤ k |
| D | 2k | (a,0), 0 ≤ a ≤ k |
| D | 2k+1 | (a,b), 0 ≤ a,b ≤ k |

The exceptional down step 0 → −1 and following up step −1 → 0 each have
label (0,0). The code handles both explicitly through the same bounds.

The maintained invariant is fᵢ = ceiling(hᵢ/2). At the final height 0, no free
vertices remain. Every top and bottom vertex is used exactly once. Connections
going right originate at odd vertices; connections going left originate at
even vertices. Thus the resulting permutation is a D-permutation.

## Cycles

Closed cycles of the partial permutation are computed after each stage. A
non-singleton cycle first appears at its largest element, a cycle peak.
Adding the dotted links i′ → i displays the corresponding directed cycle
in the bipartite graph. At a peak, the two selected free endpoints close a
cycle exactly when they were the ends of the same open chain (Lemma 7.7).
The gold highlighter follows the solid edges of each newly completed cycle.

## From almost-Dyck to 0-Schröder

The path stays at or above −1 and ends at 0. Each visit to −1 is part of
a two-step dip 0 → −1 → 0. Replace that pair by a horizontal step (2,0)
at height 0 and replace the two zero labels by a single (0,0) label.
All other steps and their labels remain unchanged.

The inverse expands each horizontal step back into D,U with labels (0,0),
(0,0), then uses the inverse construction above. In the final display,
green denotes a horizontal step, and a faint dashed dip indicates its origin.

## Default example

```
σ        = 7 1 9 2 5 4 8 6 10 3 11 12 14 13
s        = U U U U D U D D D D D U U D
heights  = 0 1 2 3 4 3 4 3 2 1 0 -1 0 1 0
labels   = (0,0) (0,0) (0,0) (0,0) (2,0) (0,1) (0,0)
           (1,1) (0,0) (0,0) (0,0) (0,0) (0,0) (0,0)
```

Cycles close at stages 5, 8, 10, 11, 12, and 14. The cycle at stage 5 and
those at 11 and 12 are singletons. Steps 11–12 become the unique horizontal
step in the 0-Schröder path.

## Selectable growing-graph representations

All three views use the same edge set at stage i:

```
E_i = { (u, σ(u)) : u ≤ i and σ(u) ≤ i }.
```

The Laguerre graph has vertex set {1,…,i} and edge set E_i. It is obtained
from Γᵢ by identifying each j with j′. Each indegree and outdegree is at
most one, so its components are open directed paths (including isolated
vertices) and directed cycles (including loops). This is the definition
in [Deb, arXiv:2304.14487v2](https://arxiv.org/pdf/2304.14487), §§1.1 and
6.2. In particular, this view uses an induced prefix and the original
Section 7 step order. It does not use that later paper's fixed vertex set
and different source-ordered edge-insertion schedule.

Every open component has exactly one missing incoming edge and exactly one
missing outgoing edge. Thus its number of open components is fᵢ. A closed
component appears exactly when a cycle is completed. The renderer computes
components only from E_i, not from the completed permutation. A singleton
with no edge is an isolated path; a singleton with edge u → u is a loop.

The arc view follows Figure 1 and §2.8 of Deb–Sokal. A non-loop edge u → v
is above the axis if u < v, and below if u > v. Fixed-point loops are omitted
and their vertices marked “fix”; edge directions follow from the side of
the axis, so arrowheads are omitted. Component colors are derived from the
current graph only, and newly inserted arcs are pink.

For each quadruple a < b < c < d of visible vertices, the counters count:

| Statistic | Present directed edges |
| --- | --- |
| Upper crossing | a → c and b → d |
| Upper nesting | a → d and b → c |
| Lower crossing | c → a and d → b |
| Lower nesting | d → a and c → b |

Shared-endpoint joinings and fixed-point pseudo-nestings are excluded. The
default complete example has upper/lower crossing counts 1/1 and
upper/lower nesting counts 1/2. These are counts of the displayed partial
arc set, not the label coordinates ξ′ and ξ″.
