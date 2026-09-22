# A permutation becomes a path

A standalone JavaScript animation of the **second bijection** in Section 7 of
Bishal Deb and Alan D. Sokal, *Classical continued fractions for some multivariate
polynomials generalizing the Genocchi and median Genocchi numbers*,
[arXiv:2212.07232v1](https://arxiv.org/abs/2212.07232).

## Open the animation

Unzip this folder and double-click **index.html**. It runs directly from the file
system in a modern browser. There is no server, installation, CDN, external font,
or runtime network dependency. The links in the source notes are optional reading.

Use **Play**, the arrow buttons, or the timeline to inspect the construction.

- **σ → path** shows the given permutation and builds its labeled path and graph.
- **path → σ** reveals the path and labels first and reconstructs the permutation.
- **View** selects Bipartite graph, Laguerre digraph, or Crossing / nesting arcs.
  Switching views preserves the step, playback, direction, and selected permutation.
- **Show cycle links**, available in the bipartite view, adds the dotted return
  arrows from i′ to i.
- **See the Schröder path** animates the final flattening of dips below zero.
- **Figure 11**, a small cycle, fixed points, random examples, and custom
  D-permutations are available. Custom examples may have 2–20 entries.
- **Present** requests browser fullscreen and simplifies the surrounding page.
  If fullscreen is unavailable, the presentation layout still works.

Keyboard: **Space** plays/pauses; **←/→** step; **Home** restarts;
**End** shows the Schröder conversion; **F** toggles presentation mode.
Input fields retain their normal keyboard controls. Reduced-motion preferences
are respected, and automatic playback starts only when requested.

## Mathematical scope

This is a computed bijection, not a sequence of pre-rendered frames. The forward
map implements equations (7.3) and (7.4) directly. The inverse follows the free
vertex construction in §7.3, using only the steps and labels. The animation also
illustrates cycle completion from Lemma 7.7 and the conversion to 0-Schröder paths
recalled in §7.1. It does not animate the continued-fraction weight derivation.

The visual language pays homage to Xavier Viennot's colored transparencies:
white space, blue mathematical objects, pink new connections, numbered choices,
and one construction step at a time. See his
[Art of Bijective Combinatorics course](https://www.imsc.res.in/~viennot/abjc-course.html).
This is an independent animation; it is not by, or affiliated with, Viennot or
the paper's authors. No slide images or paper figures are redistributed.

### Figure 11 caption correction

The default one-line permutation is

```
7 1 9 2 5 4 8 6 10 3 11 12 14 13
```

Its cycles are

```
(1 7 8 6 4 2) (3 9 10) (5) (11) (12) (13 14)
```

The cycle notation printed in Figure 11's caption is inconsistent with its
one-line notation and diagram. This animation follows the one-line notation,
diagram, and Figure 4. The labels match Figure 11, including (2,0) at step 5,
(0,1) at step 6, and (1,1) at step 8. Steps 11 and 12 are the dip that flattens.

## Files and editing

```
index.html              Ready-to-open, self-contained webpage
src/template.html       Semantic page structure and inline-build placeholders
src/style.css           Layout, color, SVG styling, animation, responsive rules
src/model.js            Pure forward/inverse bijections and example generation
src/app.js              SVG drawing, explanations, timeline, interactions
src/views.js            Pure SVG Laguerre digraph and arc-diagram renderers
build.js                Rebuilds index.html from src; Node.js built-ins only
tests/model.test.js     Exhaustive mathematical verification and edge cases
tests/app.test.js       Local interaction smoke checks with a minimal DOM fixture
tests/views.test.js     Components, visible edges, layout bounds, arc statistics
MATHEMATICS.md          Exact conventions, algorithms, and reference mapping
VALIDATION.md           Checks performed and remaining validation limitations
LICENSE                 MIT license for the original code
```

After editing `src/`, rebuild with Node.js:

```
node build.js
node tests/model.test.js
node tests/app.test.js
node tests/views.test.js
```

You may also edit `index.html` directly, but running the build will replace those
edits. No npm packages are needed for rebuilding or running the included tests.
Random examples are sampled from legal labeled histories, **not uniformly** from
the set of D-permutations.

On small screens the diagrams scroll horizontally to preserve their geometry.
For talks and close inspection, a landscape desktop display is recommended.

## The three graph views

1. **Bipartite graph:** the original Figure 11 construction, with separate top
   and bottom copies of each vertex and the same free-vertex ranks.
2. **Laguerre digraph:** identify the two copies of each visible vertex.
   Components appear as directed open paths, isolated vertices, cycles, or
   loops. Small green circles indicate a free incoming slot; blue circles
   indicate a free outgoing slot. The layout uses only the current partial
   graph, including in inverse mode; it does not reveal future edges.
3. **Crossing / nesting arcs:** vertices remain in numeric order. Edges to
   larger labels go above the axis, edges to smaller labels below. Fixed
   points have no arcs, matching Figure 1; “fix” distinguishes them from
   vertices with unfilled slots. Arrowheads are omitted. Live counters show
   upper and lower crossings and nestings of the arcs already present.

The new views retain Section 7's chronological construction. The Laguerre
digraph definition follows Bishal Deb, *Continued fractions using a Laguerre
digraph interpretation of the Foata–Zeilberger bijection and its variants*,
[arXiv:2304.14487v2](https://arxiv.org/pdf/2304.14487), §§1.1 and 6.2.
Its different edge-insertion history is not substituted for the existing
bijection. Free-slot ranks always follow increasing vertex labels, even
when the Laguerre layout rearranges components.
