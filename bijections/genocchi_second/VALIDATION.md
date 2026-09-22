# Validation

## Passed

- Figure 11: exact path heights and all 14 label pairs, checked against the paper.
- Both directions for every D-permutation of lengths 2, 4, 6, and 8:
  respectively 2, 8, 56, and 608 objects (674 total).
- Independent enumeration of all allowed labeled histories at those lengths:
  the same counts, no repeated output permutations, and exact recovery of
  every history by the forward map.
- 300 deterministically generated examples at lengths 2–20.
- At every reconstructed stage, the graph equals the induced subgraph of the
  original permutation, free-vertex counts equal ceiling(height/2), and the
  completed cycles are exactly those whose maximum is already present.
- Schröder flattening followed by expansion recovers the original steps and labels.
- Invalid permutation and label inputs are rejected.
- JavaScript syntax checks and the self-contained HTML build.
- Interaction smoke checks using a minimal local DOM fixture: initialization,
  all default stages, inverse disclosure, cycle links, example selection,
  invalid and valid custom inputs, playback/pause, keyboard shortcuts,
  presentation layout toggling, and final Schröder conversion.
- All three graph views at each default stage, including switching views
  during playback and inverse mode without changing the construction state.
- Laguerre decomposition: every visible vertex occurs exactly once, components
  reconstruct the exact edge set, and open-component counts and free incoming/
  outgoing slots agree with the bijection's height invariant.
- New SVG renderers draw exactly the current edges (with fixed-point loops
  omitted only in the arc view); layout bounds checked through size 20.
- Crossing/nesting totals checked against an independent enumeration of all
  ordered quadruples of visible vertices, including strict/shared-endpoint cases.
- Static SVG visual review of open paths, isolated vertices, loops, closed
  cycles, the completed arc diagram, and a 20-vertex directed cycle. Graphs
  were rasterized directly from the same SVG renderers used by the webpage.

## Limitations

The available browser refused navigation to local `file:` pages under its
security policy. No full-page visual browser review was completed. The new graph
SVGs were inspected independently, but the interaction fixture does not verify
browser layout, fullscreen behavior, precise SVG animation, or actual mobile
layout. Those remain useful manual checks when opening the file.

The webpage uses standard inline HTML/CSS/JavaScript and SVG. It requires no
network access to run, and its source is supplied for inspection and editing.
