// mathjax-preamble.js
window.MathJax = {
    tex: {
        macros: {
            // Eulerian numbers
            euler: ['{\\genfrac{\\langle}{\\rangle}{0pt}{0}{#1}{#2}}', 2],
            
            // Clean Eulerian numbers (with "clean" superscript)
            cleaneuler: ['{\\genfrac{\\langle}{\\rangle}{0pt}{0}{#1}{#2}^{\\text{clean}}}', 2],
            
            // Bold mu
            "bmu": "{\\boldsymbol{\\mu}}",

            
        }
    },
    // Optional: Add other MathJax settings here
    options: {
        enableMenu: false  // Disable the right-click menu if you prefer
    }
};
