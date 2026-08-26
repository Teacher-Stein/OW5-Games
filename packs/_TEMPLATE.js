/* CONTENT PACK TEMPLATE
   ---------------------------------------------------------------------------
   To make a new unit playable:

     1. Copy this file to  packs/unitNN-something.js
     2. Fill it in. Keep the shape exactly as it is — only change the content.
     3. Add one line to index.html and to each game page:
            <script src="packs/unitNN-something.js"></script>
        (in the games folder the path is  ../../packs/unitNN-something.js )
     4. Commit and push. The pack appears in the unit dropdown automatically.

   Nothing else needs editing. The games do not know or care which unit
   they are running.
   ---------------------------------------------------------------------------
*/

OW5.registerPack({
  id: 'unitNN-slug',              // must be unique, lowercase, no spaces
  unit: 'Unit N',                 // shown in the dropdown
  title: 'Unit title',
  grammar: 'the grammar this unit is drilling',

  theme: {
    corridor: 'Where the chase happens',   // e.g. 'A sinking ship'
    threat: 'THE NAME OF THE THING',       // e.g. 'THE TIDE'
    flavour: 'One line of atmosphere, shown on the title screen.'
  },

  // 12 short clues with ONE-WORD answers, from the unit's vocabulary list.
  clues: [
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' },
    { q: '', a: '' }
  ],

  // 3 writing prompts using the unit's target grammar. `model` is the answer
  // you show on screen after marking — an example, not the only right answer.
  locked: [
    { prompt: '', model: '' },
    { prompt: '', model: '' },
    { prompt: '', model: '' }
  ],

  // 2 longer listening passages, played once, each with one question.
  dark: [
    { text: '', q: '', a: '' },
    { text: '', q: '', a: '' }
  ]
});
