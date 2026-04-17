// ===== STATE =====
let selectedLanguage = "";
let currentLevel = 1;
let currentQuestionIndex = 0;
let levelQuestions = [];
let levelScore = 0;
let correctCount = 0;
let hintUsed = false;

// Progress and totalScore are loaded from Firebase (set by firebase.js)
// Fallback to localStorage if not logged in
let progress = window.progress || JSON.parse(localStorage.getItem("cqProgress3")) || {
  JavaScript: 1, Python: 1, HTML: 1, CSS: 1
};
let totalScore = window.totalScore || parseInt(localStorage.getItem("cqTotalScore3") || "0");

function saveProgress() {
  // Sync window vars so firebase.js can read them
  window.progress = progress;
  window.totalScore = totalScore;
  // Also save Firebase
  if (window.saveProgressToFirebase) {
    window.saveProgressToFirebase(levelScore, correctCount, levelQuestions.length);
  }
}

// ===== LEVEL TOPIC DESCRIPTORS =====
const levelDescriptors = {
  JavaScript: [
    "Level 1 [Absolute Basics]: Variables using var/let/const, assigning string/number/boolean values, console.log(), basic arithmetic operators +,-,*,/,%. Questions like: declare x=5 using let, log 'hello', add two numbers.",
    "Level 2 [Strings]: String concatenation with +, template literals with backticks and ${}, string methods: .length, .toUpperCase(), .toLowerCase(), .trim(), .indexOf(), .includes(), .slice(), .split(), .replace().",
    "Level 3 [Numbers & Math]: typeof, parseInt(), parseFloat(), Number(), Math.round(), Math.floor(), Math.ceil(), Math.abs(), Math.max(), Math.min(), Math.random(), Math.pow(), .toFixed(), NaN, isNaN().",
    "Level 4 [Booleans & Conditionals]: if/else, if/else if/else, ternary operator (? :), comparison operators (==, ===, !=, !==, >, <, >=, <=), logical operators (&&, ||, !), truthy/falsy values.",
    "Level 5 [Loops]: for loop (init;cond;incr), while loop, do...while loop, break statement, continue statement, nested for loops, looping through a range of numbers.",
    "Level 6 [Arrays Basics]: Creating arrays, accessing by index [0], .length, .push(), .pop(), .shift(), .unshift(), .indexOf(), .includes(), .join(), .reverse(), .slice(), .splice().",
    "Level 7 [Array Methods]: .forEach(), .map(), .filter(), .reduce(), .find(), .findIndex(), .some(), .every(), .flat(), .sort() with comparator, Array.from(), Array.isArray().",
    "Level 8 [Objects Basics]: Object literal {}, dot notation, bracket notation, adding properties, deleting properties, Object.keys(), Object.values(), Object.entries(), checking property with 'in' operator, hasOwnProperty().",
    "Level 9 [Functions]: function declaration, function expression, named vs anonymous, parameters vs arguments, return statement, default parameter values, rest parameters ...args, calling functions.",
    "Level 10 [Arrow Functions & Scope]: Arrow function syntax () => {}, concise body, var vs let vs const differences, block scope, function scope, hoisting behavior, temporal dead zone basics.",
    "Level 11 [DOM Basics]: document.getElementById(), document.querySelector(), document.querySelectorAll(), .innerHTML, .textContent, .createElement(), .appendChild(), .removeChild(), .classList.add/remove/toggle.",
    "Level 12 [DOM Events]: addEventListener(), click/mouseover/mouseout/keydown/keyup events, event.target, event.preventDefault(), event.stopPropagation(), removing event listeners, event delegation.",
    "Level 13 [ES6+ Destructuring & Spread]: Array destructuring, object destructuring, default values in destructuring, rest in destructuring, spread operator in arrays, spread in function calls, object spread.",
    "Level 14 [Promises & Async/Await]: new Promise(resolve, reject), .then(), .catch(), .finally(), async function declaration, await keyword, try/catch with async, Promise.all(), Promise.race().",
    "Level 15 [Error Handling]: try/catch block, try/catch/finally, throw new Error('msg'), error.message, error.name, custom error classes extending Error, TypeError, ReferenceError, SyntaxError.",
    "Level 16 [Classes & OOP]: class declaration, constructor() method, instance methods, new keyword, this keyword, extends for inheritance, super() call, super.method(), static methods and properties.",
    "Level 17 [Modules]: export default, named export, import default, import named ({}), import as alias, re-export, export { name as alias }, dynamic import() returning Promise.",
    "Level 18 [Closures & Higher-Order Functions]: closure concept, functions returning functions, factory functions, function as argument (callback), memoization basics, partial application, function composition with arrow functions.",
    "Level 19 [Iterators & Generators]: Symbol.iterator protocol, for...of loop, custom iterable objects, generator function syntax (function*), yield keyword, .next() method, generator return value, infinite generators.",
    "Level 20 [Regular Expressions]: RegExp literal /pattern/flags, new RegExp(), .test(), .match(), .replace(), .search(), character classes [a-z], quantifiers (*,+,?,{n}), anchors (^,$), groups (), flags (g,i,m).",
    "Level 21 [Map, Set, WeakMap, WeakSet]: new Map(), map.set/get/has/delete/size, iterating map, new Set(), set.add/has/delete/size, set to array, WeakMap and WeakSet differences, Symbol creation and use.",
    "Level 22 [Proxy & Reflect]: new Proxy(target, handler), get trap, set trap, has trap, deleteProperty trap, apply trap, Reflect.get(), Reflect.set(), Reflect.has(), use cases for validation.",
    "Level 23 [Event Loop & Async Model]: call stack concept, event loop, task queue (macrotasks), microtask queue, Promise vs setTimeout ordering, queueMicrotask(), requestAnimationFrame(), blocking vs non-blocking.",
    "Level 24 [Performance & Patterns]: debounce function, throttle function, memoization with Map/WeakMap, lazy evaluation, object pooling concept, tail call optimization, performance.now(), memory leak patterns to avoid.",
    "Level 25 [Design Patterns]: Module pattern (IIFE), Singleton pattern, Observer/EventEmitter pattern, Factory function pattern, Strategy pattern, Command pattern — write JS implementations.",
    "Level 26 [Functional Programming]: Pure functions (no side effects), immutability with Object.freeze/spread, function composition (compose/pipe), Maybe pattern, functor concept, curry function implementation.",
    "Level 27 [Advanced Async]: async generators (async function*), for await...of, AsyncIterator protocol, AbortController and AbortSignal, fetch with timeout using AbortController, stream reading basics.",
    "Level 28 [TypeScript-style Concepts in JS]: JSDoc type annotations, instanceof checks, type guards (typeof/instanceof), duck typing, tagged union patterns, branded types using Symbols.",
    "Level 29 [Node.js Concepts]: require() vs import, module.exports, __dirname, __filename, process.argv, process.env, fs.readFileSync/writeFileSync, path.join/resolve, EventEmitter pattern, streams concept.",
    "Level 30 [Mastery & Best Practices]: SOLID principles with JS examples, dependency injection pattern, immutable data patterns, pure function architecture, code splitting concepts, tree-shaking, advanced debugging techniques."
  ],
  Python: [
    "Level 1 [Absolute Basics]: print(), variable assignment, data types (int, float, str, bool), basic arithmetic (+,-,*,/,//,%,**), comments (#), input() function, type() function.",
    "Level 2 [Strings]: String indexing [0], slicing [start:end:step], len(), str.upper()/lower()/strip()/lstrip()/rstrip(), str.replace(), str.split(), str.join(), f-strings (f'{}'), str.count(), str.startswith()/endswith().",
    "Level 3 [Numbers & Math]: int/float conversion, math module (math.sqrt, math.floor, math.ceil, math.pi, math.factorial), round(), abs(), max(), min(), divmod(), complex numbers, bin()/oct()/hex().",
    "Level 4 [Booleans & Conditionals]: if/elif/else, comparison operators (==,!=,<,>,<=,>=), logical operators (and/or/not), None comparison (is None), truthiness of empty collections, walrus operator :=.",
    "Level 5 [Loops]: for loop over range()/list/string, while loop, break, continue, pass, else on loops, enumerate(), zip(), nested loops, list comprehension preview.",
    "Level 6 [Lists]: list creation [], indexing, slicing, list.append(), list.pop(), list.remove(), list.insert(), list.extend(), list.sort(), list.reverse(), list.copy(), list.index(), list.count(), del statement.",
    "Level 7 [List Comprehensions & Tuples]: [expr for x in iterable if cond], nested comprehensions, tuple creation (), tuple indexing, tuple unpacking, tuple as dict key, namedtuple from collections.",
    "Level 8 [Dictionaries]: dict creation {}, dict.get(key, default), dict[key]=val, del dict[key], dict.keys(), dict.values(), dict.items(), dict.update(), dict.pop(), dict comprehension {k:v for ...}, defaultdict.",
    "Level 9 [Sets & Frozensets]: set creation {1,2,3} or set(), set.add(), set.remove(), set.discard(), set.union(|), set.intersection(&), set.difference(-), set.symmetric_difference(^), set comprehension, frozenset.",
    "Level 10 [Functions]: def keyword, parameters, return, multiple return values (tuple), *args, **kwargs, default parameter values, keyword-only arguments, lambda functions, docstrings, scope (LEGB rule).",
    "Level 11 [Modules & Standard Library]: import module, from module import name, import as alias, __name__ == '__main__', os module (os.path, os.getcwd, os.listdir), sys.argv, math, random, datetime modules.",
    "Level 12 [File I/O]: open(file, mode), with open() as f, f.read(), f.readline(), f.readlines(), f.write(), f.writelines(), csv module (csv.reader/writer/DictReader), json.load/dump/loads/dumps.",
    "Level 13 [Error Handling]: try/except, try/except/else/finally, raise Exception('msg'), raise from, multiple except clauses, except Exception as e, custom exception class (class MyError(Exception):), assert statement.",
    "Level 14 [OOP Basics]: class definition, __init__(self), self parameter, instance attributes, class attributes, instance methods, __str__(), __repr__(), __len__(), __eq__(), creating instances.",
    "Level 15 [OOP Inheritance]: class Child(Parent), super().__init__(), method overriding, super().method(), isinstance(), issubclass(), multiple inheritance, Method Resolution Order (MRO), __mro__.",
    "Level 16 [OOP Advanced]: @property decorator, @name.setter, @name.deleter, @staticmethod, @classmethod, cls parameter, __slots__, abstract base classes with ABC, @abstractmethod.",
    "Level 17 [Iterators & Generators]: __iter__() and __next__() protocol, StopIteration exception, generator function with yield, yield from, generator expressions (x for x in ...), itertools (chain, cycle, islice, product).",
    "Level 18 [Decorators]: function decorator syntax @decorator, decorator that wraps a function, @functools.wraps, decorator with arguments (decorator factory), class decorators, chaining multiple decorators.",
    "Level 19 [Context Managers]: with statement mechanics, __enter__ and __exit__ methods, contextlib.contextmanager with yield, contextlib.suppress, contextlib.ExitStack, writing reusable context managers.",
    "Level 20 [Functional & Comprehensions]: map(), filter(), zip() with unpacking, functools.reduce(), functools.partial(), functools.lru_cache(), operator module (operator.add, operator.itemgetter), sorted with key.",
    "Level 21 [Regular Expressions]: import re, re.search(), re.match(), re.findall(), re.sub(), re.split(), re.compile(), groups (), named groups (?P<name>), flags re.IGNORECASE/re.MULTILINE, raw strings r''.",
    "Level 22 [Concurrency]: threading.Thread, thread.start()/join(), threading.Lock(), with lock, multiprocessing.Process, concurrent.futures.ThreadPoolExecutor, concurrent.futures.ProcessPoolExecutor, as_completed().",
    "Level 23 [Async Programming]: import asyncio, async def, await expression, asyncio.run(), asyncio.gather(), asyncio.sleep(), async for, async with, asyncio.Queue, event loop concepts.",
    "Level 24 [Advanced Data Structures]: heapq.heappush/heappop, bisect.bisect_left/insort, collections.Counter (most_common), collections.deque (appendleft/rotate), collections.ChainMap, array module.",
    "Level 25 [Testing]: unittest.TestCase, self.assertEqual/assertTrue/assertRaises, setUp/tearDown, @unittest.skip, unittest.mock.Mock, mock.patch, pytest fixtures concept, parametrize concept.",
    "Level 26 [Type Hints]: from typing import List/Dict/Tuple/Optional/Union/Any/Callable/TypeVar, function annotations, variable annotations, dataclasses (@dataclass, field()), Protocol class.",
    "Level 27 [Metaprogramming]: __getattr__, __setattr__, __delattr__, __getattribute__, type() to create classes dynamically, metaclass=MyMeta, __init_subclass__(), __class_getitem__(), vars() and dir().",
    "Level 28 [Performance & Profiling]: timeit.timeit(), cProfile.run(), __slots__ for memory, avoiding global variables, list vs generator memory, numpy array basics, Cython concept, PyPy concept.",
    "Level 29 [Design Patterns in Python]: Singleton with metaclass, Factory with classmethod, Observer with list of callbacks, Strategy with duck typing, Decorator pattern vs Python decorator, Command pattern.",
    "Level 30 [Advanced Python Mastery]: descriptor protocol (__get__/__set__/__delete__), __init_subclass__ for plugin systems, ast module basics, dis module basics, memory model (id(), is), CPython reference counting concept."
  ],
  HTML: [
    "Level 1 [Document Basics]: <!DOCTYPE html>, <html lang='en'>, <head>, <body>, <title>, <meta charset='UTF-8'>, <meta name='viewport'>, HTML comments <!-- -->, document structure.",
    "Level 2 [Text Elements]: <h1>-<h6>, <p>, <br>, <hr>, <strong>, <em>, <b>, <i>, <small>, <mark>, <del>, <ins>, <sup>, <sub>, <abbr title=''>, <code>, <pre>, <blockquote>.",
    "Level 3 [Links & Anchors]: <a href='url'>, target='_blank', rel='noopener noreferrer', relative vs absolute URLs, anchor links (href='#id'), <a href='mailto:email'>, <a href='tel:number'>, download attribute.",
    "Level 4 [Images]: <img src='' alt=''>, width/height attributes, figure and figcaption, loading='lazy', decoding='async', srcset attribute basics, image as link (img inside a), missing alt text issues.",
    "Level 5 [Lists]: <ul>, <ol>, <li>, <dl>, <dt>, <dd>, nested lists, type attribute (disc/circle/square for ul, 1/a/A/i/I for ol), start attribute on ol, reversed attribute.",
    "Level 6 [Tables]: <table>, <thead>, <tbody>, <tfoot>, <tr>, <th>, <td>, colspan attribute, rowspan attribute, <caption>, scope='col'/'row', <colgroup>, <col>.",
    "Level 7 [Forms Basics]: <form action='' method=''>, <input type='text/email/password/number/checkbox/radio'>, <label for='id'>, name attribute, id attribute, value attribute, placeholder, required.",
    "Level 8 [Forms Advanced]: <select>, <option value=''>, <optgroup label=''>, <textarea rows='' cols=''>, <button type='submit/reset/button'>, <fieldset>, <legend>, disabled, readonly, autofocus, multiple.",
    "Level 9 [Semantic HTML5]: <header>, <nav>, <main>, <article>, <section>, <aside>, <footer>, <time datetime=''>, <address>, <figure>, <figcaption>, <details>, <summary>, <dialog>.",
    "Level 10 [Multimedia]: <audio src='' controls>, <video src='' controls width=''>, <source src='' type=''>, autoplay, muted, loop, poster, <track kind='subtitles'>, <iframe src=''>, sandbox attribute.",
    "Level 11 [HTML Attributes]: id, class (multiple classes), style='', data-* custom attributes, hidden attribute, tabindex, contenteditable, draggable='true', spellcheck, translate='no', lang on element.",
    "Level 12 [Input Types & Validation]: type='date/time/datetime-local/color/range/file/search/url/tel/week/month', min, max, step, pattern, minlength, maxlength, novalidate on form, oninvalid.",
    "Level 13 [Meta Tags & SEO]: <meta name='description' content=''>, <meta name='robots' content=''>, <meta property='og:title' content=''>, <link rel='canonical' href=''>, <link rel='icon' href=''>, hreflang.",
    "Level 14 [HTML5 APIs via HTML]: <input type='file' accept=''>, <input type='file' multiple capture='environment'>, <progress value='' max=''>, <meter value='' min='' max=''>, <output for=''>, <template>.",
    "Level 15 [Accessibility ARIA]: role='button/navigation/main/banner/contentinfo', aria-label='', aria-describedby='', aria-hidden='true', aria-live='polite', aria-expanded, aria-current, tabindex='-1'/0.",
    "Level 16 [Canvas & SVG]: <canvas id='' width='' height=''>, <svg width='' height='' viewBox=''>, <circle cx='' cy='' r=''>, <rect x='' y='' width='' height=''>, <line x1='' y1='' x2='' y2=''>, <text x='' y=''>, <path d=''>.",
    "Level 17 [Modern HTML Elements]: <dialog open>, dialog.showModal()/close(), <details open>, <summary>, <slot name=''>, <template id=''>, <picture>, <source media='' srcset=''>, <portal> concept.",
    "Level 18 [Web Components]: customElements.define('tag-name', class), HTMLElement extension, connectedCallback, disconnectedCallback, attributeChangedCallback, observedAttributes, Shadow DOM (attachShadow({mode:'open'})).",
    "Level 19 [Performance HTML]: <link rel='preload' as='font/script/style'>, <link rel='prefetch'>, <link rel='preconnect'>, <script defer>, <script async>, <script type='module'>, critical CSS inline.",
    "Level 20 [HTML Forms Deep]: <input list='datalist-id'>, <datalist id=''>, <option> inside datalist, form attribute on input (associate to form by id), formaction/formmethod on button, inputmode attribute.",
    "Level 21 [Constraint Validation]: required, pattern, min/max/minlength/maxlength, input.validity object, input.checkValidity(), input.setCustomValidity('msg'), form.reportValidity(), :valid/:invalid CSS pseudo.",
    "Level 22 [Responsive Images]: <img srcset='img-400.jpg 400w, img-800.jpg 800w' sizes='(max-width:600px) 400px, 800px'>, <picture>, <source media='(min-width:800px)' srcset=''>, WebP/AVIF type attribute.",
    "Level 23 [Structured Data]: itemscope, itemtype='https://schema.org/Person', itemprop='name', <script type='application/ld+json'> with JSON-LD, @context, @type, common schema types (Article, Product, FAQ).",
    "Level 24 [Security in HTML]: <meta http-equiv='Content-Security-Policy' content=''>, rel='noopener noreferrer' on links, <iframe sandbox='allow-scripts'>, crossorigin='anonymous', integrity (SRI) on script/link.",
    "Level 25 [Script Integration]: <script> in body vs head, defer vs async attributes, <script type='module'>, <script nomodule>, <noscript> fallback, inline event handlers (onclick='') vs addEventListener.",
    "Level 26 [Advanced File Handling]: <input type='file' accept='image/*,.pdf'>, capture='user' for front camera, multiple for multiple files, reading files with FileReader (via JS), drag-and-drop HTML attributes (ondragover, ondrop).",
    "Level 27 [Internationalization]: lang='ar' dir='rtl', bidi text with <bdo dir='rtl'>, <ruby> <rt> for ruby annotations, <wbr> for word break, &nbsp; &amp; &lt; &gt; &quot; entities, charset considerations.",
    "Level 28 [HTML Living Standard]: New input types, ping attribute on links, imagesizes/imagesrcset on link, blocking='render' on script/link, fetchpriority='high/low/auto', popover attribute, popovertarget.",
    "Level 29 [HTML Performance Auditing]: LCP element identification (largest image/text), CLS-causing HTML (img without dimensions, dynamic insertion), INP via event handlers, avoiding layout-triggering attributes.",
    "Level 30 [Mastery & Best Practices]: Document outline algorithm, heading hierarchy (one h1), semantic over div-soup, progressive enhancement, graceful degradation, HTML validation, accessibility audit checklist."
  ],
  CSS: [
    "Level 1 [Basics]: CSS syntax (selector {property: value;}), inline style attribute, <style> in head, external <link rel='stylesheet'>, color property (names/hex/rgb), background-color, applying to elements.",
    "Level 2 [Text & Fonts]: font-family (with fallbacks), font-size (px/em/rem), font-weight (100-900/bold), font-style (italic), text-align (left/center/right/justify), text-decoration, line-height, letter-spacing, word-spacing.",
    "Level 3 [Box Model]: width, height, padding (all sides vs shorthand), margin (auto centering), border (width style color shorthand), border-radius, box-sizing: border-box, outline vs border.",
    "Level 4 [Display & Visibility]: display: block/inline/inline-block/none, visibility: hidden vs display:none, opacity (0-1), overflow: hidden/scroll/auto/visible, max-width/min-width/max-height/min-height.",
    "Level 5 [Selectors]: element (p), class (.box), id (#main), descendant (div p), direct child (ul > li), adjacent sibling (h1 + p), general sibling (h1 ~ p), multiple selectors (h1, h2), universal (*).",
    "Level 6 [Pseudo-classes]: :hover, :focus, :active, :visited, :link, :first-child, :last-child, :nth-child(n), :nth-child(odd/even), :only-child, :not(selector), :checked, :disabled, :enabled, :empty.",
    "Level 7 [Pseudo-elements]: ::before, ::after (with content property), ::first-line, ::first-letter, ::placeholder, ::selection (background/color), ::marker, content: 'text'/counter()/url().",
    "Level 8 [Positioning]: position: static/relative/absolute/fixed/sticky, top/right/bottom/left offsets, z-index, stacking context creation, position relative as containing block, sticky with overflow.",
    "Level 9 [Flexbox Basics]: display: flex, flex-direction (row/column/row-reverse/column-reverse), justify-content (flex-start/center/flex-end/space-between/space-around/space-evenly), align-items (stretch/center/flex-start/flex-end), flex-wrap, gap/column-gap/row-gap.",
    "Level 10 [Flexbox Advanced]: flex-grow, flex-shrink, flex-basis, flex shorthand (flex: 1), align-self, order property, align-content (for multi-line), flex: 0 0 auto vs flex: 1 1 auto differences.",
    "Level 11 [Grid Basics]: display: grid, grid-template-columns (px/fr/auto/repeat()), grid-template-rows, fr unit, gap, grid-column: span 2, grid-row: span 2, column-gap/row-gap.",
    "Level 12 [Grid Advanced]: grid-template-areas with named areas, placing items in areas (grid-area: name), auto-fill vs auto-fit with repeat(), minmax(), grid-auto-flow: row/column/dense, implicit grid (grid-auto-columns/rows).",
    "Level 13 [Backgrounds]: background-image: url(), background-size: cover/contain/px, background-position, background-repeat: no-repeat/repeat-x/repeat-y, background-attachment: fixed, multiple backgrounds, background shorthand, linear-gradient/radial-gradient.",
    "Level 14 [Transitions]: transition-property, transition-duration, transition-timing-function (ease/linear/ease-in/ease-out/ease-in-out), transition-delay, transition shorthand, transitioning multiple properties, :hover triggered transitions.",
    "Level 15 [Animations]: @keyframes name { from {} to {} }, @keyframes with % steps, animation-name, animation-duration, animation-timing-function, animation-delay, animation-iteration-count (infinite), animation-direction (alternate), animation-fill-mode (forwards), animation shorthand.",
    "Level 16 [Transforms]: transform: translate(x,y)/translateX/translateY, rotate(deg), scale(x,y), skew(x,y), multiple transforms in one property, transform-origin, perspective property, rotateX/rotateY/rotateZ for 3D.",
    "Level 17 [CSS Variables]: --variable-name: value, var(--name), var(--name, fallback), :root scope, local scope in selector, changing variables with JS (setProperty), dynamic theming with variables.",
    "Level 18 [Responsive Design]: @media (max-width: 768px), @media (min-width: 600px), @media (orientation: landscape), mobile-first approach, viewport units (vw, vh, vmin, vmax, svh, dvh), responsive typography.",
    "Level 19 [CSS Functions]: calc(100% - 20px), min(50%, 300px), max(200px, 50%), clamp(min, preferred, max), env(safe-area-inset-top), rgb()/rgba(), hsl()/hsla(), color-mix(in srgb, color1 50%, color2).",
    "Level 20 [Specificity & Cascade]: specificity calculation (inline=1000, id=100, class=10, element=1), !important, when to avoid !important, @layer basics, inheritance (inherit/initial/unset/revert keywords), all property.",
    "Level 21 [Advanced Selectors]: :is(h1, h2, h3), :where() (zero specificity), :has(> img) relational selector, :not(.class, #id) complex, :nth-child(3n+1), :nth-of-type(), attribute selector [attr^=val]/[attr$=val]/[attr*=val].",
    "Level 22 [CSS Grid Mastery]: subgrid (grid-template-columns: subgrid), grid template shorthand, overlay techniques (same grid-area), named lines ([line-name]), grid-template shorthand, masonry layout concept.",
    "Level 23 [Scroll & Overflow]: scroll-behavior: smooth, scroll-snap-type (x/y mandatory/proximity), scroll-snap-align (start/center/end), overscroll-behavior (none/contain), overflow-clip-margin, scrollbar-gutter.",
    "Level 24 [Filters & Blend Modes]: filter: blur(px)/brightness(%)/contrast(%)/grayscale(%)/saturate(%)/drop-shadow(), backdrop-filter: blur(), mix-blend-mode (multiply/screen/overlay), isolation: isolate, background-blend-mode.",
    "Level 25 [Logical Properties]: margin-inline (replaces margin-left/right), margin-block (replaces margin-top/bottom), padding-inline-start/end, border-inline, writing-mode (vertical-rl), text-orientation, direction: rtl.",
    "Level 26 [Container Queries]: @container (min-width: 400px), container-type: inline-size/size/normal, container-name, cqw/cqh/cqi/cqb units, style queries (@container style(--theme: dark)), nested containers.",
    "Level 27 [CSS Houdini & @property]: @property --name { syntax: '<color>'; inherits: false; initial-value: red; }, CSS.registerProperty(), paint worklet concept, animating custom properties with @property.",
    "Level 28 [Performance CSS]: will-change: transform/opacity, contain: layout/style/paint/size, content-visibility: auto, contain-intrinsic-size, avoiding layout thrashing, GPU compositing layers, font-display: swap.",
    "Level 29 [Modern CSS 2024+]: CSS nesting (& selector), @layer order (base, components, utilities), oklch() color function, color-scheme property, light-dark() function, :has() complex selectors, @starting-style.",
    "Level 30 [CSS Architecture & Mastery]: BEM naming (.block__element--modifier), OOCSS principles, utility-first concept, CSS custom property systems (design tokens), CSS modules concept, critical CSS, print stylesheets (@media print)."
  ]
};

// ===== QUESTION CACHE =====
async function generateQuestions(lang, level) {
  const key = `cq4_q_${lang}_L${level}`;

  // Check localStorage cache first
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length >= 20) return parsed;
    }
  } catch (e) { }

  const descriptor = levelDescriptors[lang][level - 1];

  const prompt = `You are an expert coding quiz generator for "CodeQuest", a browser-based game.

Generate exactly 25 quiz questions for:
Language: ${lang}
${descriptor}

STRUCTURE:
- Questions 1-10: MULTIPLE CHOICE (type: "mcq") — 4 options each, one correct
- Questions 11-25: SHORT ANSWER (type: "short") — exact code or technical term

STRICT RULES:
1. MCQ options must be plausible and distinct (no obviously wrong answers)
2. Short-answer questions: include 2-4 valid answers (cover semicolons, quote styles, spacing)
3. Each question tests ONE specific, concrete coding concept
4. Questions progress from easier to harder within the level
5. Keep questions practical and concrete
6. Hints guide WITHOUT giving away the answer

OUTPUT FORMAT: Respond ONLY with a raw JSON array. No markdown, no code fences, no explanation.

[
  {
    "type": "mcq",
    "question": "Which method adds an item to the end of an array?",
    "options": ["A) .push()", "B) .pop()", "C) .shift()", "D) .unshift()"],
    "answers": ["A) .push()", "A", ".push()"],
    "hint": "Think about pushing something onto a stack"
  },
  {
    "type": "short",
    "question": "Write the exact code to...",
    "answers": ["correct_answer", "alternate_valid_answer"],
    "hint": "Helpful hint without giving away the answer"
  }
]

Generate all 25 questions now:`;

  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();
  const raw = data.text || "[]";
  const clean = raw.replace(/```json|```/g, "").trim();

  let questions;
  try {
    questions = JSON.parse(clean);
  } catch (e) {
    const match = clean.match(/\[[\s\S]*\]/);
    questions = match ? JSON.parse(match[0]) : [];
  }

  // Cache to localStorage
  try {
    localStorage.setItem(key, JSON.stringify(questions));
  } catch (e) {
    // Storage full — evict oldest cached question sets
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith("cq4_q_"));
    allKeys.slice(0, Math.ceil(allKeys.length / 2)).forEach(k => localStorage.removeItem(k));
    try { localStorage.setItem(key, JSON.stringify(questions)); } catch (e2) { }
  }

  return questions;
}

// ===== SCREEN MANAGEMENT =====
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active");
    s.style.display = "";
  });
  const el = document.getElementById(id);
  el.style.display = "flex";
  requestAnimationFrame(() => el.classList.add("active"));
  if (id === "languageScreen") renderStars();
  if (id === "levelScreen") renderLevels();
  if (id === "leaderboardScreen" && window.loadLeaderboard) window.loadLeaderboard();
}

function showLanguages() { showScreen("languageScreen"); }

// ===== STARS & PROGRESS =====
function renderStars() {
  ["JavaScript", "Python", "HTML", "CSS"].forEach(lang => {
    const el = document.getElementById("stars-" + lang);
    const bar = document.getElementById("bar-" + lang);
    if (!el) return;
    const done = Math.min(progress[lang] - 1, 30);
    const pct = Math.round((done / 30) * 100);
    el.textContent = `${done}/30 levels`;
    el.style.color = done > 0 ? "#f59e0b" : "#2a3a4a";
    if (bar) bar.style.width = pct + "%";
  });
}

// ===== LANGUAGE SELECTION =====
function selectLanguage(lang) {
  selectedLanguage = lang;
  document.getElementById("langTitle").innerText = lang + " — Select Level";
  showScreen("levelScreen");
}

// ===== LEVEL GRID =====
const TIER_LABELS = ["Foundations", "Core", "Intermediate", "Advanced", "Expert", "Mastery"];

function renderLevels() {
  const container = document.getElementById("levels");
  container.innerHTML = "";

  for (let tier = 0; tier < 6; tier++) {
    const tierWrap = document.createElement("div");
    tierWrap.className = "tier-group";

    const label = document.createElement("div");
    label.className = "tier-label";
    label.textContent = `${TIER_LABELS[tier]} (Levels ${tier * 5 + 1}–${tier * 5 + 5})`;
    tierWrap.appendChild(label);

    const row = document.createElement("div");
    row.className = "tier-row";

    for (let j = 1; j <= 5; j++) {
      const lvl = tier * 5 + j;
      const btn = document.createElement("button");
      btn.className = "level-btn";

      const unlocked = lvl <= progress[selectedLanguage];
      const completed = lvl < progress[selectedLanguage];

      btn.innerHTML = `
        <span class="lv-num">${lvl}</span>
        <span class="lv-status">${completed ? "✓" : unlocked ? "▶" : "🔒"}</span>
      `;

      if (!unlocked) {
        btn.classList.add("locked");
      } else {
        if (completed) btn.classList.add("completed");
        btn.onclick = () => startLevel(lvl);
      }

      row.appendChild(btn);
    }

    tierWrap.appendChild(row);
    container.appendChild(tierWrap);
  }
}

// ===== GAME =====
async function startLevel(level) {
  currentLevel = level;
  currentQuestionIndex = 0;
  levelQuestions = [];
  levelScore = 0;
  correctCount = 0;

  // Reset UI
  document.getElementById("answer").value = "";
  document.getElementById("result").className = "result-box";
  document.getElementById("result").textContent = "";
  document.getElementById("nextBtn").classList.add("hidden");
  document.getElementById("aiExplanation").classList.add("hidden");
  document.getElementById("hintBox").classList.add("hidden");
  document.getElementById("answerArea").classList.add("hidden");
  document.getElementById("loadingState").classList.remove("hidden");
  document.getElementById("question").textContent = "";

  showScreen("gameScreen");

  try {
    levelQuestions = await generateQuestions(selectedLanguage, level);
    if (!Array.isArray(levelQuestions) || levelQuestions.length === 0) throw new Error("empty");
  } catch (e) {
    document.getElementById("loadingState").classList.add("hidden");
    document.getElementById("question").textContent = "⚠️ Could not load questions. Please check your internet connection and try again.";
    return;
  }

  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("answerArea").classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const q = levelQuestions[currentQuestionIndex];
  if (!q) return;
  hintUsed = false;

  document.getElementById("levelTitle").textContent = `${selectedLanguage} · Level ${currentLevel}`;
  document.getElementById("question").textContent = q.question;
  document.getElementById("progressBar").style.width =
    ((currentQuestionIndex / levelQuestions.length) * 100) + "%";
  document.getElementById("scoreDisplay").textContent = totalScore + levelScore;
  document.getElementById("result").className = "result-box";
  document.getElementById("result").textContent = "";
  document.getElementById("nextBtn").classList.add("hidden");
  document.getElementById("aiExplanation").classList.add("hidden");
  document.getElementById("hintBox").classList.add("hidden");

  const isMCQ = q.type === "mcq" && Array.isArray(q.options);
  document.getElementById("qCounter").textContent = "";
  document.getElementById("qCounter").innerHTML =
    `Q ${currentQuestionIndex + 1} / ${levelQuestions.length}` +
    (isMCQ ? ' <span class="mcq-badge">MCQ</span>' : '');
  const answerArea = document.getElementById("answerArea");
  const mcqArea = document.getElementById("mcqArea");

  if (isMCQ) {
    answerArea.classList.add("hidden");
    mcqArea.classList.remove("hidden");
    // Render option buttons
    mcqArea.innerHTML = q.options.map((opt, i) => `
      <button class="mcq-btn" onclick="checkMCQ(${i})">${opt}</button>
    `).join("");
  } else {
    mcqArea.classList.add("hidden");
    answerArea.classList.remove("hidden");
    document.getElementById("answer").value = "";
    document.getElementById("answer").focus();
  }
}

function showHint() {
  const q = levelQuestions[currentQuestionIndex];
  if (!q) return;
  document.getElementById("hintText").textContent = q.hint || "Review the topic carefully!";
  document.getElementById("hintBox").classList.remove("hidden");
  hintUsed = true;
}

function normalise(s) {
  return String(s).replace(/\s+/g, " ").trim().toLowerCase();
}

function checkMCQ(selectedIndex) {
  const q = levelQuestions[currentQuestionIndex];
  const result = document.getElementById("result");
  const buttons = document.querySelectorAll(".mcq-btn");

  // Disable all buttons
  buttons.forEach(b => b.disabled = true);

  const selectedText = q.options[selectedIndex];
  const answers = Array.isArray(q.answers) ? q.answers : [q.answers];
  const isCorrect = answers.some(a => normalise(selectedText) === normalise(a) ||
    normalise(selectedIndex === 0 ? "A" : selectedIndex === 1 ? "B" : selectedIndex === 2 ? "C" : "D") === normalise(a) ||
    normalise(selectedText.replace(/^[A-D][).:]\s*/i, "")) === normalise(a.replace(/^[A-D][).:]\s*/i, "")));

  // Highlight correct and wrong
  buttons.forEach((b, i) => {
    const bText = q.options[i];
    const bAnswers = Array.isArray(q.answers) ? q.answers : [q.answers];
    const bCorrect = bAnswers.some(a =>
      normalise(bText) === normalise(a) ||
      normalise(bText.replace(/^[A-D][).:]\s*/i, "")) === normalise(a.replace(/^[A-D][).:]\s*/i, ""))
    );
    if (bCorrect) b.classList.add("mcq-correct");
    else if (i === selectedIndex && !isCorrect) b.classList.add("mcq-wrong");
  });

  if (isCorrect) {
    result.className = "result-box success";
    result.textContent = "✅ Correct!";
    const pts = hintUsed ? 5 : 10;
    levelScore += pts;
    correctCount++;
    document.getElementById("scoreDisplay").textContent = totalScore + levelScore;
  } else {
    result.className = "result-box error";
    result.textContent = `❌ Incorrect. Correct: ${q.options.find((opt, i) => {
      const bAnswers = Array.isArray(q.answers) ? q.answers : [q.answers];
      return bAnswers.some(a =>
        normalise(opt) === normalise(a) ||
        normalise(opt.replace(/^[A-D][).:]\s*/i, "")) === normalise(a.replace(/^[A-D][).:]\s*/i, ""))
      );
    }) || q.answers[0]}`;
  }

  document.getElementById("nextBtn").classList.remove("hidden");
  fetchAIExplanation(q.question, selectedText, isCorrect, q.answers[0] || "");
}

function checkAnswer() {
  const ans = document.getElementById("answer").value.trim();
  if (!ans) return;

  const q = levelQuestions[currentQuestionIndex];
  const result = document.getElementById("result");
  const answers = Array.isArray(q.answers) ? q.answers : [q.answers];
  const isCorrect = answers.some(a => normalise(ans) === normalise(a));

  if (isCorrect) {
    result.className = "result-box success";
    result.textContent = "✅ Correct!";
    const pts = hintUsed ? 5 : 10;
    levelScore += pts;
    correctCount++;
    document.getElementById("scoreDisplay").textContent = totalScore + levelScore;
  } else {
    result.className = "result-box error";
    const shown = answers[0] || "—";
    result.textContent = `❌ Incorrect. Expected: ${shown}`;
  }

  document.getElementById("nextBtn").classList.remove("hidden");
  fetchAIExplanation(q.question, ans, isCorrect, answers[0] || "");
}

function nextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex >= levelQuestions.length) {
    // Unlock next level
    if (currentLevel >= progress[selectedLanguage]) {
      progress[selectedLanguage] = Math.min(currentLevel + 1, 31);
    }
    totalScore += levelScore;
    window.totalScore = totalScore;
    saveProgress();

    document.getElementById("victoryMsg").textContent =
      `${selectedLanguage} Level ${currentLevel} complete! ${correctCount} / ${levelQuestions.length} correct.`;
    document.getElementById("pointsEarned").textContent = levelScore;
    document.getElementById("totalScoreDisplay").textContent = totalScore;
    document.getElementById("victoryStreak").textContent = `🔥${window.userStreak || 0}`;
    showScreen("victoryScreen");
    return;
  }

  document.getElementById("result").className = "result-box";
  document.getElementById("result").textContent = "";
  document.getElementById("aiExplanation").classList.add("hidden");
  renderQuestion();
}

function continueToNextLevel() {
  if (currentLevel < 30) {
    startLevel(currentLevel + 1);
  } else {
    showScreen("languageScreen");
  }
}

// ===== AI TUTOR =====
async function fetchAIExplanation(question, userAnswer, isCorrect, correctAnswer) {
  const aiBox = document.getElementById("aiExplanation");
  const aiText = document.getElementById("aiText");
  aiBox.classList.remove("hidden");
  aiText.className = "ai-text loading";
  aiText.textContent = "Thinking...";

  const prompt = isCorrect
    ? `A student correctly answered a ${selectedLanguage} coding question. In exactly 2 sentences: explain WHY it is correct and share one quick pro tip related to it.\nQ: ${question}\nA: ${userAnswer}`
    : `A student incorrectly answered a ${selectedLanguage} question. In exactly 2 sentences: gently explain their mistake and give a nudge toward the right direction WITHOUT giving away the full answer.\nQ: ${question}\nStudent wrote: ${userAnswer}\nCorrect answer: ${correctAnswer}`;

  try {
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    const text = data.text || "No explanation available.";
    aiText.className = "ai-text";
    aiText.textContent = text;
  } catch (e) {
    aiText.className = "ai-text";
    aiText.textContent = "AI tutor unavailable right now.";
  }
}

// ===== BACKGROUND CANVAS =====
function initCanvas() {
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);

  const pts = Array.from({ length: 55 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.3 + 0.3,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    a: Math.random() * 0.4 + 0.1
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,220,200,${p.a})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,220,200,${0.035 * (1 - d / 110)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  const answerInput = document.getElementById("answer");
  answerInput.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const nextBtn = document.getElementById("nextBtn");
    if (!nextBtn.classList.contains("hidden")) {
      nextQuestion();
    } else {
      checkAnswer();
    }
  });
  initCanvas();
  renderStars();
});
